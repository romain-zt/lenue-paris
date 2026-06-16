import * as migration_20260615_103821 from './20260615_103821';
import * as migration_20260616_105307_pages_blocks from './20260616_105307_pages_blocks';

export const migrations = [
  {
    up: migration_20260615_103821.up,
    down: migration_20260615_103821.down,
    name: '20260615_103821',
  },
  {
    up: migration_20260616_105307_pages_blocks.up,
    down: migration_20260616_105307_pages_blocks.down,
    name: '20260616_105307_pages_blocks'
  },
];
