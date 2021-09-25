export type NullsPurged<T> = {
  [K in keyof T]: null extends T[K] ? Exclude<T[K], null> | undefined : T[K];
};

export function purgeNulls<T>(value: T): NullsPurged<T> {
  return Object.entries(value).reduce((acc, [key, val]) => {
    acc[key as keyof T] = val === null ? undefined : val;
    return acc;
  }, {} as NullsPurged<T>);
}
