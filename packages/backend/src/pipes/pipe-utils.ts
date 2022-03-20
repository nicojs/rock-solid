export type Flat<T> = {
  [K in keyof T]: any[] extends T[K] ? string : T[K];
};
