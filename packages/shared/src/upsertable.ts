export type Upsertable<T, TRequired extends keyof T> = Pick<T, TRequired> &
  Partial<Omit<T, TRequired>>;
