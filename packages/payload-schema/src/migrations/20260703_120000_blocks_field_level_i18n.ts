import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { runSql } from './helpers/idempotent'
import {
  PUBLISHED_BLOCK_SPECS,
  VERSION_BLOCK_SPECS,
  assertAfterTransform,
  isBlockLevelI18n,
  isFieldLevelI18n,
  snapshotBlockI18n,
  type BlockTableSpec,
} from './helpers/blockI18nCounts'

const LOCALE_PRIORITY = `CASE _locale WHEN 'en' THEN 0 WHEN 'fr' THEN 1 WHEN 'ru' THEN 2 ELSE 3 END`

function localeTableDDL(spec: BlockTableSpec): string {
  const columns = spec.localizedColumns.map((column) => `"${column}" varchar`).join(',\n      ')
  const parentType = spec.versionTable ? 'integer' : 'varchar'

  return `
    CREATE TABLE IF NOT EXISTS "${spec.localeTable}" (
      ${columns},
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" ${parentType} NOT NULL
    );
  `
}

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `)
  return Boolean(result.rows?.[0]?.exists)
}

async function columnExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `)
  return Boolean(result.rows?.[0]?.exists)
}

async function countDistinctBlocks(db: MigrateUpArgs['db'], spec: BlockTableSpec): Promise<number> {
  const result = await db.execute(
    sql.raw(`
      SELECT COUNT(*)::int AS n FROM (
        SELECT DISTINCT _parent_id, _path, _order
        FROM "${spec.blockTable}"
      ) s
    `),
  )
  return Number(result.rows?.[0]?.n ?? 0)
}

async function getNonLocalizedColumns(db: MigrateUpArgs['db'], spec: BlockTableSpec): Promise<string[]> {
  const skip = new Set(['id', '_order', '_parent_id', '_path', '_locale', '_uuid', ...spec.localizedColumns])
  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${spec.blockTable}
  `)
  return (result.rows ?? [])
    .map((row) => String((row as { column_name: string }).column_name))
    .filter((name) => !skip.has(name))
}

async function transformBlockTable(db: MigrateUpArgs['db'], spec: BlockTableSpec): Promise<void> {
  if (!(await tableExists(db, spec.blockTable))) return
  if (!(await columnExists(db, spec.blockTable, '_locale'))) return

  const before = await snapshotBlockI18n(db, spec)
  if (before.blockRows === 0) return

  const expectedCanonical = await countDistinctBlocks(db, spec)

  await runSql(db, localeTableDDL(spec))
  await runSql(
    db,
    `
    CREATE UNIQUE INDEX IF NOT EXISTS "${spec.localeTable}_locale_parent_id_unique"
    ON "${spec.localeTable}" USING btree ("_locale", "_parent_id");
    `,
  )

  const localizedSelect = spec.localizedColumns.map((column) => `src."${column}"`).join(', ')
  const insertColumns = [...spec.localizedColumns.map((c) => `"${c}"`), '"_locale"', '"_parent_id"'].join(', ')

  await runSql(
    db,
    `
    CREATE TEMP TABLE "${spec.blockTable}_canonical" ON COMMIT DROP AS
    SELECT DISTINCT ON (_parent_id, _path, _order)
      id AS canonical_id,
      _parent_id,
      _path,
      _order
    FROM "${spec.blockTable}"
    ORDER BY _parent_id, _path, _order, ${LOCALE_PRIORITY}, id;
    `,
  )

  await runSql(
    db,
    `
    CREATE TEMP TABLE "${spec.blockTable}_id_map" ON COMMIT DROP AS
    SELECT src.id AS old_id, c.canonical_id
    FROM "${spec.blockTable}" src
    INNER JOIN "${spec.blockTable}_canonical" c
      ON src._parent_id = c._parent_id
      AND src._path = c._path
      AND src._order = c._order;
    `,
  )

  await runSql(
    db,
    `
    INSERT INTO "${spec.localeTable}" (${insertColumns})
    SELECT ${localizedSelect}, src._locale, map.canonical_id
    FROM "${spec.blockTable}" src
    INNER JOIN "${spec.blockTable}_id_map" map ON src.id = map.old_id
    ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
    `,
  )

  const nonLocalizedColumns = await getNonLocalizedColumns(db, spec)
  if (nonLocalizedColumns.length > 0) {
    const setClause = nonLocalizedColumns
      .map((column) => `"${column}" = preferred."${column}"`)
      .join(', ')
    await runSql(
      db,
      `
      UPDATE "${spec.blockTable}" AS canonical
      SET ${setClause}
      FROM "${spec.blockTable}" preferred
      WHERE canonical.id = (
        SELECT c.canonical_id FROM "${spec.blockTable}_canonical" c
        WHERE c._parent_id = canonical._parent_id
          AND c._path = canonical._path
          AND c._order = canonical._order
      )
      AND preferred._parent_id = canonical._parent_id
      AND preferred._path = canonical._path
      AND preferred._order = canonical._order
      AND preferred.id = (
        SELECT p.id
        FROM "${spec.blockTable}" p
        WHERE p._parent_id = canonical._parent_id
          AND p._path = canonical._path
          AND p._order = canonical._order
        ORDER BY ${LOCALE_PRIORITY}, p.id
        LIMIT 1
      );
      `,
    )
  }

  await runSql(
    db,
    `
    DELETE FROM "${spec.blockTable}" AS src
    USING "${spec.blockTable}_id_map" map
    WHERE src.id = map.old_id
      AND src.id::text <> map.canonical_id::text;
    `,
  )

  for (const column of spec.localizedColumns) {
    await runSql(db, `ALTER TABLE "${spec.blockTable}" DROP COLUMN IF EXISTS "${column}" CASCADE;`)
  }
  await runSql(db, `ALTER TABLE "${spec.blockTable}" DROP COLUMN IF EXISTS "_locale" CASCADE;`)
  await runSql(db, `DROP INDEX IF EXISTS "${spec.blockTable}_locale_idx";`)

  await runSql(
    db,
    `
    DO $$ BEGIN
      ALTER TABLE "${spec.localeTable}"
        ADD CONSTRAINT "${spec.localeTable}_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."${spec.blockTable}"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
    `,
  )

  const after = await snapshotBlockI18n(db, spec)
  assertAfterTransform(spec, before, after, expectedCanonical)
}

async function dedupePageRels(db: MigrateUpArgs['db'], table: 'pages_rels' | '_pages_v_rels'): Promise<void> {
  if (!(await tableExists(db, table))) return
  if (!(await columnExists(db, table, 'locale'))) return

  await runSql(
    db,
    `
    DELETE FROM "${table}" AS a
    USING "${table}" AS b
    WHERE a.id > b.id
      AND a.parent_id = b.parent_id
      AND a.path = b.path
      AND a.products_id IS NOT DISTINCT FROM b.products_id;
    `,
  )

  await runSql(db, `DROP INDEX IF EXISTS "${table}_locale_idx";`)
  await runSql(db, `DROP INDEX IF EXISTS "${table}_products_id_idx";`)
  await runSql(db, `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "locale" CASCADE;`)
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS "${table}_products_id_idx" ON "${table}" USING btree ("products_id");`,
  )
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const fieldLevel = await isFieldLevelI18n(db)
  const blockLevel = await isBlockLevelI18n(db)

  if (fieldLevel && !blockLevel) {
    payload.logger.info('20260703_120000_blocks_field_level_i18n: already applied — skipping')
    return
  }

  if (!blockLevel && !fieldLevel) {
    payload.logger.info('20260703_120000_blocks_field_level_i18n: no block-level tables — skipping')
    return
  }

  payload.logger.info('20260703_120000_blocks_field_level_i18n: starting block-level → field-level i18n transform')

  const beforeSnapshots = new Map<string, Awaited<ReturnType<typeof snapshotBlockI18n>>>()
  for (const spec of [...PUBLISHED_BLOCK_SPECS, ...VERSION_BLOCK_SPECS]) {
    const snapshot = await snapshotBlockI18n(db, spec)
    beforeSnapshots.set(spec.blockTable, snapshot)
    payload.logger.info({ msg: 'before snapshot', table: spec.blockTable, ...snapshot })
  }

  for (const spec of PUBLISHED_BLOCK_SPECS) {
    await transformBlockTable(db, spec)
  }
  for (const spec of VERSION_BLOCK_SPECS) {
    await transformBlockTable(db, spec)
  }

  await dedupePageRels(db, 'pages_rels')
  await dedupePageRels(db, '_pages_v_rels')

  for (const spec of [...PUBLISHED_BLOCK_SPECS, ...VERSION_BLOCK_SPECS]) {
    const after = await snapshotBlockI18n(db, spec)
    const before = beforeSnapshots.get(spec.blockTable)!
    payload.logger.info({ msg: 'after snapshot', table: spec.blockTable, before, after })
  }

  payload.logger.info('20260703_120000_blocks_field_level_i18n: complete — all row-count checks passed')
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  payload.logger.warn(
    '20260703_120000_blocks_field_level_i18n: down migration is destructive — manual review recommended',
  )

  if (!(await isFieldLevelI18n(db))) return

  for (const spec of [...PUBLISHED_BLOCK_SPECS, ...VERSION_BLOCK_SPECS]) {
    if (!(await tableExists(db, spec.localeTable))) continue

    await runSql(db, `DROP TABLE IF EXISTS "${spec.localeTable}" CASCADE;`)

    for (const column of spec.localizedColumns) {
      await runSql(db, `ALTER TABLE "${spec.blockTable}" ADD COLUMN IF NOT EXISTS "${column}" varchar;`)
    }
    await runSql(db, `ALTER TABLE "${spec.blockTable}" ADD COLUMN IF NOT EXISTS "_locale" "_locales";`)
    await runSql(
      db,
      `CREATE INDEX IF NOT EXISTS "${spec.blockTable}_locale_idx" ON "${spec.blockTable}" USING btree ("_locale");`,
    )
  }

  if (await tableExists(db, 'pages_rels') && !(await columnExists(db, 'pages_rels', 'locale'))) {
    await runSql(db, `ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "locale" "_locales";`)
  }
  if (await tableExists(db, '_pages_v_rels') && !(await columnExists(db, '_pages_v_rels', 'locale'))) {
    await runSql(db, `ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "locale" "_locales";`)
  }
}
