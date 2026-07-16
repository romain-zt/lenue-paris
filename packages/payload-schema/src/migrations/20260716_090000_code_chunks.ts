import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS code_chunks (
      id            serial PRIMARY KEY,
      file_path     varchar NOT NULL,
      language      varchar NOT NULL DEFAULT 'text',
      symbol        varchar,
      chunk_index   integer NOT NULL DEFAULT 0,
      start_line    integer NOT NULL DEFAULT 1,
      end_line      integer NOT NULL DEFAULT 1,
      text          text NOT NULL,
      embedding     vector(1536),
      updated_at    timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT code_chunks_unique
        UNIQUE (file_path, chunk_index)
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS code_chunks_lookup_idx
      ON code_chunks (file_path);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS code_chunks_embedding_hnsw_idx
      ON code_chunks
      USING hnsw (embedding vector_cosine_ops);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS code_chunks;`);
}
