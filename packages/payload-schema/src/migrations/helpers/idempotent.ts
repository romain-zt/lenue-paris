import type { MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Run one SQL statement; safe when prod was partially synced via Payload dev push. */
export async function runSql(db: MigrateUpArgs['db'], statement: string): Promise<void> {
  await db.execute(sql.raw(statement))
}

export async function createEnumIfNotExists(
  db: MigrateUpArgs['db'],
  name: string,
  values: string[],
): Promise<void> {
  const literal = values.map((v) => `'${v}'`).join(', ')
  await runSql(
    db,
    `
    DO $do$ BEGIN
      CREATE TYPE "public"."${name}" AS ENUM(${literal});
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $do$;
    `,
  )
}

export async function addConstraintIfNotExists(
  db: MigrateUpArgs['db'],
  statement: string,
): Promise<void> {
  await runSql(
    db,
    `
    DO $do$ BEGIN
      ${statement}
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $do$;
    `,
  )
}
