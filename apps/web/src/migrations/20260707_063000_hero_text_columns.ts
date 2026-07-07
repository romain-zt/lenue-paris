import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { runSql } from './helpers/idempotent'

const HERO_TABLES = ['pages_blocks_hero', '_pages_v_blocks_hero'] as const

/**
 * Prod hero tables created via dev push before these text fields existed lack
 * `tagline` / `cta_label` / `cta_link`, breaking the published-page query.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of HERO_TABLES) {
    await runSql(db, `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "tagline" varchar;`)
    await runSql(db, `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "cta_label" varchar;`)
    await runSql(
      db,
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "cta_link" varchar DEFAULT '/catalogue';`,
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of HERO_TABLES) {
    await runSql(db, `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "tagline";`)
    await runSql(db, `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "cta_label";`)
    await runSql(db, `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "cta_link";`)
  }
}
