import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { runSql } from "./helpers/idempotent";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runSql(
    db,
    `ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runSql(
    db,
    `ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "autosave";`,
  );
}
