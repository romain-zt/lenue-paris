import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { addConstraintIfNotExists, runSql } from './helpers/idempotent'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runSql(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "hero_video_id" integer;`,
  )
  await runSql(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN IF NOT EXISTS "hero_video_id" integer;`,
  )

  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )
  await addConstraintIfNotExists(
    db,
    `ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
  )

  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS "pages_blocks_hero_hero_video_idx" ON "pages_blocks_hero" USING btree ("hero_video_id");`,
  )
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_hero_video_idx" ON "_pages_v_blocks_hero" USING btree ("hero_video_id");`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runSql(db, `ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "hero_video_id";`)
  await runSql(db, `ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN IF EXISTS "hero_video_id";`)
}
