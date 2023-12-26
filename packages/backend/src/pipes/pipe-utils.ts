import { Injectable, PipeTransform } from '@nestjs/common';

export type Queryfied<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K]
    : T[K] extends string | undefined
      ? T[K]
      : undefined extends T[K]
        ? string | undefined
        : string;
};

export function filterMetaQuery<T extends Record<string, unknown>>(query: T) {
  return Object.entries(query)
    .filter(([key]) => !key.startsWith('_'))
    .reduce(
      (acc, [k, v]) => {
        acc[k] = v;
        return acc;
      },
      {} as Record<string, unknown>,
    ) as T;
}

export function tryParseInt(val: string | undefined): number | undefined {
  if (val === undefined) {
    return undefined;
  }
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

@Injectable()
export class MetaFilterPipe implements PipeTransform {
  transform(value: Record<string, unknown>): unknown {
    return filterMetaQuery(value);
  }
}
