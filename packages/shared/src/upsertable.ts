export type Upsertable<T, TRequired extends keyof T = never> = Pick<
  T,
  TRequired
> &
  Partial<Omit<T, TRequired>>;
