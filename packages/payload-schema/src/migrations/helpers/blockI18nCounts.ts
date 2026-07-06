import type { MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export type BlockTableSpec = {
  blockTable: string
  localeTable: string
  localizedColumns: string[]
  /** When true, block PK is serial integer (version tables). */
  versionTable?: boolean
}

export type BlockI18nSnapshot = {
  blockRows: number
  localeRows: number
  localizedFieldValues: number
}

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
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
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `)
  return Boolean(result.rows?.[0]?.exists)
}

export async function isBlockLevelI18n(db: MigrateUpArgs['db']): Promise<boolean> {
  if (!(await tableExists(db, 'pages_blocks_hero'))) return false
  return columnExists(db, 'pages_blocks_hero', '_locale')
}

export async function isFieldLevelI18n(db: MigrateUpArgs['db']): Promise<boolean> {
  if (!(await tableExists(db, 'pages_blocks_hero_locales'))) return false
  return !(await columnExists(db, 'pages_blocks_hero', '_locale'))
}

export async function snapshotBlockI18n(
  db: MigrateUpArgs['db'],
  spec: BlockTableSpec,
): Promise<BlockI18nSnapshot> {
  const blockExists = await tableExists(db, spec.blockTable)
  if (!blockExists) {
    return { blockRows: 0, localeRows: 0, localizedFieldValues: 0 }
  }

  const blockRowsResult = await db.execute(
    sql.raw(`SELECT COUNT(*)::int AS n FROM "${spec.blockTable}"`),
  )
  const blockRows = Number(blockRowsResult.rows?.[0]?.n ?? 0)

  const hasBlockLocale = await columnExists(db, spec.blockTable, '_locale')
  const localeTableExists = await tableExists(db, spec.localeTable)

  let localeRows = 0
  let localizedFieldValues = 0

  if (hasBlockLocale) {
    localeRows = blockRows
    const coalesceExpr = spec.localizedColumns
      .map((column) => `CASE WHEN "${column}" IS NOT NULL AND "${column}" <> '' THEN 1 ELSE 0 END`)
      .join(' + ')
    const valuesResult = await db.execute(
      sql.raw(`SELECT COALESCE(SUM(${coalesceExpr}), 0)::int AS n FROM "${spec.blockTable}"`),
    )
    localizedFieldValues = Number(valuesResult.rows?.[0]?.n ?? 0)
  } else if (localeTableExists) {
    const localeRowsResult = await db.execute(
      sql.raw(`SELECT COUNT(*)::int AS n FROM "${spec.localeTable}"`),
    )
    localeRows = Number(localeRowsResult.rows?.[0]?.n ?? 0)

    const coalesceExpr = spec.localizedColumns
      .map((column) => `CASE WHEN "${column}" IS NOT NULL AND "${column}" <> '' THEN 1 ELSE 0 END`)
      .join(' + ')
    const valuesResult = await db.execute(
      sql.raw(`SELECT COALESCE(SUM(${coalesceExpr}), 0)::int AS n FROM "${spec.localeTable}"`),
    )
    localizedFieldValues = Number(valuesResult.rows?.[0]?.n ?? 0)
  }

  return { blockRows, localeRows, localizedFieldValues }
}

export function assertAfterTransform(
  spec: BlockTableSpec,
  before: BlockI18nSnapshot,
  after: BlockI18nSnapshot,
  expectedCanonicalBlocks: number,
): void {
  if (before.blockRows === 0) return

  if (after.localeRows < before.localeRows) {
    throw new Error(
      `[${spec.blockTable}] locale row loss: before=${before.localeRows}, after=${after.localeRows}`,
    )
  }

  if (after.localizedFieldValues < before.localizedFieldValues) {
    throw new Error(
      `[${spec.blockTable}] localized field value loss: before=${before.localizedFieldValues}, after=${after.localizedFieldValues}`,
    )
  }

  if (after.blockRows !== expectedCanonicalBlocks) {
    throw new Error(
      `[${spec.blockTable}] block rows not collapsed to canonical set: expected=${expectedCanonicalBlocks}, after=${after.blockRows}`,
    )
  }
}

export const PUBLISHED_BLOCK_SPECS: BlockTableSpec[] = [
  {
    blockTable: 'pages_blocks_hero',
    localeTable: 'pages_blocks_hero_locales',
    localizedColumns: ['season', 'tagline', 'cta_label'],
  },
  {
    blockTable: 'pages_blocks_featured_products',
    localeTable: 'pages_blocks_featured_products_locales',
    localizedColumns: ['title', 'view_collection_label'],
  },
  {
    blockTable: 'pages_blocks_editorial_strip',
    localeTable: 'pages_blocks_editorial_strip_locales',
    localizedColumns: ['label', 'headline', 'subline', 'body', 'cta_label'],
  },
  {
    blockTable: 'pages_blocks_product_grid',
    localeTable: 'pages_blocks_product_grid_locales',
    localizedColumns: ['title'],
  },
]

export const VERSION_BLOCK_SPECS: BlockTableSpec[] = [
  {
    blockTable: '_pages_v_blocks_hero',
    localeTable: '_pages_v_blocks_hero_locales',
    localizedColumns: ['season', 'tagline', 'cta_label'],
    versionTable: true,
  },
  {
    blockTable: '_pages_v_blocks_featured_products',
    localeTable: '_pages_v_blocks_featured_products_locales',
    localizedColumns: ['title', 'view_collection_label'],
    versionTable: true,
  },
  {
    blockTable: '_pages_v_blocks_editorial_strip',
    localeTable: '_pages_v_blocks_editorial_strip_locales',
    localizedColumns: ['label', 'headline', 'subline', 'body', 'cta_label'],
    versionTable: true,
  },
  {
    blockTable: '_pages_v_blocks_product_grid',
    localeTable: '_pages_v_blocks_product_grid_locales',
    localizedColumns: ['title'],
    versionTable: true,
  },
]
