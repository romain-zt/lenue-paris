import * as migration_20260615_103821 from './20260615_103821';

export const migrations = [
  {
    up: migration_20260615_103821.up,
    down: migration_20260615_103821.down,
    name: '20260615_103821'
  },
];
