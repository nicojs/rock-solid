/**
 * Useful to fill forms
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? DeepPartial<U>[]
    : DeepPartial<T[K]>;
};

export type DeepKeyOf<T> = (
  [T] extends [never]
    ? ''
    : T extends object
    ? {
        [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DeepKeyOf<T[K]>>}`;
      }[Exclude<keyof T, symbol>]
    : ''
) extends infer D
  ? Extract<D, string>
  : never;

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;
