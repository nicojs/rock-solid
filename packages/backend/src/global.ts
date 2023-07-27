import type { User as RockSolidUser } from '@rock-solid/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends RockSolidUser {}
  }
}
