import * as migration_20260615_103821 from './20260615_103821';
import * as migration_20260616_105307_pages_blocks from './20260616_105307_pages_blocks';
import * as migration_20260616_121945_collections_product_grid from './20260616_121945_collections_product_grid';
import * as migration_20260616_190000_hero_video from './20260616_190000_hero_video';
import * as migration_20260617_120000_capsule_limited_series from './20260617_120000_capsule_limited_series';
import * as migration_20260618_200000_site_settings_global from './20260618_200000_site_settings_global';

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
];
