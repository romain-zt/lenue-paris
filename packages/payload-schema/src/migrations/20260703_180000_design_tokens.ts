import type { MigrateUpArgs, MigrateDownArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS design_tokens (
      id                  serial PRIMARY KEY,
      color_primary       varchar DEFAULT '#1c1917',
      color_secondary     varchar DEFAULT '#44403c',
      color_muted         varchar DEFAULT '#78716c',
      color_subtle        varchar DEFAULT '#a8a29e',
      color_page_bg       varchar DEFAULT '#faf7f4',
      color_surface       varchar DEFAULT '#ffffff',
      color_editorial     varchar DEFAULT '#f0ebe4',
      color_section       varchar DEFAULT '#f5f0ea',
      color_skeleton      varchar DEFAULT '#e8e5e2',
      color_accent        varchar DEFAULT '#1c1917',
      color_accent_hover  varchar DEFAULT '#44403c',
      color_accent_text   varchar DEFAULT '#ffffff',
      color_border        varchar DEFAULT '#e7e5e4',
      font_serif          varchar DEFAULT 'Cormorant Garamond, Georgia, serif',
      font_sans           varchar DEFAULT 'Jost, Helvetica Neue, Arial, sans-serif',
      updated_at          timestamptz DEFAULT now() NOT NULL,
      created_at          timestamptz DEFAULT now() NOT NULL,
      global_type         varchar UNIQUE
    );
  `);

  await db.execute(sql`
    INSERT INTO design_tokens (
      global_type,
      color_primary, color_secondary, color_muted, color_subtle,
      color_page_bg, color_surface, color_editorial, color_section, color_skeleton,
      color_accent, color_accent_hover, color_accent_text, color_border,
      font_serif, font_sans
    )
    SELECT
      'design-tokens',
      '#1c1917', '#44403c', '#78716c', '#a8a29e',
      '#faf7f4', '#ffffff', '#f0ebe4', '#f5f0ea', '#e8e5e2',
      '#1c1917', '#44403c', '#ffffff', '#e7e5e4',
      'Cormorant Garamond, Georgia, serif',
      'Jost, Helvetica Neue, Arial, sans-serif'
    WHERE NOT EXISTS (SELECT 1 FROM design_tokens WHERE global_type = 'design-tokens');
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS design_tokens;`);
}
