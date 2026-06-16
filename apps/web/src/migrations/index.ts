import * as migration_20260615_103821 from './20260615_103821';
import * as migration_20260616_105307_pages_blocks from './20260616_105307_pages_blocks';
import * as migration_20260616_121945_collections_product_grid from './20260616_121945_collections_product_grid';

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
    name: '20260616_121945_collections_product_grid'
  },
];
