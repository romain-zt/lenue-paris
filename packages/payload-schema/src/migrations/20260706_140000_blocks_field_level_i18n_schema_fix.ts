import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";
import {
  PUBLISHED_BLOCK_SPECS,
  VERSION_BLOCK_SPECS,
  isBlockLevelI18n,
  isFieldLevelI18n,
  type BlockTableSpec,
} from "./helpers/blockI18nCounts";

function localeTableDDL(spec: BlockTableSpec): string {
  const columns = spec.localizedColumns.map((column) => `"${column}" varchar`).join(",\n      ");
  const parentType = spec.versionTable ? "integer" : "varchar";

  return `
    CREATE TABLE IF NOT EXISTS "${spec.localeTable}" (
      ${columns},
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" ${parentType} NOT NULL
    );
  `;
}

async function tableExists(db: MigrateUpArgs["db"], table: string): Promise<boolean> {
  const { sql } = await import("@payloadcms/db-postgres");
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `);
  return Boolean(result.rows?.[0]?.exists);
}

async function columnExists(
  db: MigrateUpArgs["db"],
  table: string,
  column: string,
): Promise<boolean> {
  const { sql } = await import("@payloadcms/db-postgres");
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `);
  return Boolean(result.rows?.[0]?.exists);
}

async function applyEmptyFieldLevelSchema(
  db: MigrateUpArgs["db"],
  spec: BlockTableSpec,
): Promise<void> {
  if (!(await tableExists(db, spec.blockTable))) return;
  if (!(await columnExists(db, spec.blockTable, "_locale"))) return;
  if (await tableExists(db, spec.localeTable)) return;

  await runSql(db, localeTableDDL(spec));
  await runSql(
    db,
    `
    CREATE UNIQUE INDEX IF NOT EXISTS "${spec.localeTable}_locale_parent_id_unique"
    ON "${spec.localeTable}" USING btree ("_locale", "_parent_id");
    `,
  );

  for (const column of spec.localizedColumns) {
    await runSql(db, `ALTER TABLE "${spec.blockTable}" DROP COLUMN IF EXISTS "${column}" CASCADE;`);
  }
  await runSql(db, `ALTER TABLE "${spec.blockTable}" DROP COLUMN IF EXISTS "_locale" CASCADE;`);
  await runSql(db, `DROP INDEX IF EXISTS "${spec.blockTable}_locale_idx";`);

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
  );
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  if (await isFieldLevelI18n(db)) {
    payload.logger.info(
      "20260706_140000_blocks_field_level_i18n_schema_fix: field-level schema already present — skipping",
    );
    return;
  }

  if (!(await isBlockLevelI18n(db))) {
    payload.logger.info(
      "20260706_140000_blocks_field_level_i18n_schema_fix: no block-level tables — skipping",
    );
    return;
  }

  payload.logger.info(
    "20260706_140000_blocks_field_level_i18n_schema_fix: applying field-level block schema (empty DB case)",
  );

  for (const spec of [...PUBLISHED_BLOCK_SPECS, ...VERSION_BLOCK_SPECS]) {
    await applyEmptyFieldLevelSchema(db, spec);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const spec of [...PUBLISHED_BLOCK_SPECS, ...VERSION_BLOCK_SPECS]) {
    if (!(await tableExists(db, spec.localeTable))) continue;
    await runSql(db, `DROP TABLE IF EXISTS "${spec.localeTable}" CASCADE;`);
  }
}
