import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runSql(
    db,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "limited_series" boolean DEFAULT false;`,
  );
  await runSql(
    db,
    `ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_limited_series" boolean DEFAULT false;`,
  );
  await runSql(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "show_capsule_badge" boolean DEFAULT false;`,
  );
  await runSql(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN IF NOT EXISTS "show_capsule_badge" boolean DEFAULT false;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runSql(db, `ALTER TABLE "products" DROP COLUMN IF EXISTS "limited_series";`);
  await runSql(db, `ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_limited_series";`);
  await runSql(db, `ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "show_capsule_badge";`);
  await runSql(db, `ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN IF EXISTS "show_capsule_badge";`);
}
