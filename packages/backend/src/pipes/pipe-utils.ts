import { Injectable, PipeTransform } from '@nestjs/common';

export type Flat<T> = {
  [K in keyof T]: any[] extends T[K] ? string : T[K];
};

export function filterMetaQuery<T>(query: T) {
  return Object.entries(query)
    .filter(([key]) => !key.startsWith('_'))
    .reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {} as Record<string, unknown>) as T;
}

@Injectable()
export class MetaFilterPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return filterMetaQuery(value);
  }
}
