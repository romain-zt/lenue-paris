import * as migration_20260615_103821 from './20260615_103821';
import * as migration_20260616_105307_pages_blocks from './20260616_105307_pages_blocks';
import * as migration_20260616_121945_collections_product_grid from './20260616_121945_collections_product_grid';
import * as migration_20260616_190000_hero_video from './20260616_190000_hero_video';
import * as migration_20260617_120000_capsule_limited_series from './20260617_120000_capsule_limited_series';
import * as migration_20260618_200000_site_settings_global from './20260618_200000_site_settings_global';
import * as migration_20260619_160000_pages_v_autosave from './20260619_160000_pages_v_autosave';
import * as migration_20260707_061500_pages_blocks_locale from './20260707_061500_pages_blocks_locale';
import * as migration_20260707_062000_hero_season_column from './20260707_062000_hero_season_column';
import * as migration_20260707_063000_hero_text_columns from './20260707_063000_hero_text_columns';

export const migrations = [
  {
    up: migration_20260615_103821.up,
    down: migration_20260615_103821.down,
    name: '20260615_103821',
  },
  {
    up: migration_20260616_105307_pages_blocks.up,
    down: migration_20260616_105307_pages_blocks.down,
    name: '20260616_105307_pages_blocks',
  },
  {
    up: migration_20260616_121945_collections_product_grid.up,
    down: migration_20260616_121945_collections_product_grid.down,
    name: '20260616_121945_collections_product_grid',
  },
  {
    up: migration_20260616_190000_hero_video.up,
    down: migration_20260616_190000_hero_video.down,
    name: '20260616_190000_hero_video',
  },
  {
    up: migration_20260617_120000_capsule_limited_series.up,
    down: migration_20260617_120000_capsule_limited_series.down,
    name: '20260617_120000_capsule_limited_series',
  },
  {
    up: migration_20260618_200000_site_settings_global.up,
    down: migration_20260618_200000_site_settings_global.down,
    name: '20260618_200000_site_settings_global',
  },
  {
    up: migration_20260619_160000_pages_v_autosave.up,
    down: migration_20260619_160000_pages_v_autosave.down,
    name: '20260619_160000_pages_v_autosave',
  },
  {
    up: migration_20260707_061500_pages_blocks_locale.up,
    down: migration_20260707_061500_pages_blocks_locale.down,
    name: '20260707_061500_pages_blocks_locale',
  },
  {
    up: migration_20260707_062000_hero_season_column.up,
    down: migration_20260707_062000_hero_season_column.down,
    name: '20260707_062000_hero_season_column',
  },
  {
    up: migration_20260707_063000_hero_text_columns.up,
    down: migration_20260707_063000_hero_text_columns.down,
    name: '20260707_063000_hero_text_columns',
  },
];
