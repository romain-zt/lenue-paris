import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runSql(
    db,
    `CREATE TABLE IF NOT EXISTS "site_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "brand_name" varchar DEFAULT 'Lénue Paris' NOT NULL,
      "instagram_url" varchar,
      "whatsapp_phone" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runSql(db, `DROP TABLE IF EXISTS "site_settings";`);
}
