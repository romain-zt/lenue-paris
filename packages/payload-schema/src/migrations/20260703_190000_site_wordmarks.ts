import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS brand_wordmark_primary varchar,
      ADD COLUMN IF NOT EXISTS brand_wordmark_secondary varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE site_settings
      DROP COLUMN IF EXISTS brand_wordmark_primary,
      DROP COLUMN IF EXISTS brand_wordmark_secondary;
  `);
}
