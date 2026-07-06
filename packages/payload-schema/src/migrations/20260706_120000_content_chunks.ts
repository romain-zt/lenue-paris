import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_chunks (
      id            serial PRIMARY KEY,
      collection    varchar NOT NULL,
      doc_id        varchar NOT NULL,
      locale        varchar NOT NULL DEFAULT 'fr',
      field_path    varchar NOT NULL,
      chunk_index   integer NOT NULL DEFAULT 0,
      text          text NOT NULL,
      embedding     vector(1536),
      updated_at    timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT content_chunks_unique
        UNIQUE (collection, doc_id, locale, field_path, chunk_index)
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS content_chunks_lookup_idx
      ON content_chunks (collection, doc_id, locale);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS content_chunks_embedding_hnsw_idx
      ON content_chunks
      USING hnsw (embedding vector_cosine_ops);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS content_chunks;`);
}
