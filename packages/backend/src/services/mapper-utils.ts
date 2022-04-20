import { Decimal } from '@prisma/client/runtime/index.js';
import { Decimal as OtherDecimal } from '@rock-solid/shared';

export type NullsPurged<T> = T extends Array<infer U>
  ? Array<NullsPurged<U>>
  : T extends string | symbol | number | boolean | Date | Decimal
  ? T
  : {
      [K in keyof T]: null extends T[K]
        ? Exclude<NullsPurged<T[K]>, null> | undefined
        : NullsPurged<T[K]>;
    };

export function purgeNulls<T>(value: T): NullsPurged<T> {
  if (Array.isArray(value)) {
    return value.map(purgeNulls) as NullsPurged<T>;
  }
  if (
    value instanceof Date ||
    value instanceof Decimal ||
    value instanceof OtherDecimal
  ) {
    return value as NullsPurged<T>;
  }
  if (value === null || value === undefined) {
    return undefined as unknown as NullsPurged<T>;
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = purgeNulls(val);
      return acc;
    }, {} as any);
  }
  return value as NullsPurged<T>;
}
