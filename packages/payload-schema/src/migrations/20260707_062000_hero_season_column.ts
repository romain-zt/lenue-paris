import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runSql(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "season" varchar;`,
  );
  await runSql(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN IF NOT EXISTS "season" varchar;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runSql(db, `ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "season";`);
  await runSql(db, `ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN IF EXISTS "season";`);
}
