import { Injectable, PipeTransform } from '@nestjs/common';

export type Queryfied<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K]
    : undefined extends T[K]
    ? string | undefined
    : string;
};

export function filterMetaQuery<T extends Record<string, unknown>>(query: T) {
  return Object.entries(query)
    .filter(([key]) => !key.startsWith('_'))
    .reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {} as Record<string, unknown>) as T;
}

@Injectable()
export class MetaFilterPipe implements PipeTransform {
  transform(value: Record<string, unknown>): unknown {
    return filterMetaQuery(value);
  }
}
