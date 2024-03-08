export type Upsertable<T, TRequired extends keyof T = never> = Required<
  Pick<T, TRequired>
> &
  Partial<Omit<T, TRequired>>;

/**
 * A utility type for patching objects; as in `HTTP PATCH /api/...`.
 * When patching in rock-solid and you want to delete while patching, you need to be explicit.
 */
export type Patchable<
  T extends { id: number },
  TForbidden extends keyof T = never,
> = {
  [Prop in Exclude<keyof T, TForbidden>]?: undefined extends T[Prop]
    ? T[Prop] | null
    : T[Prop];
} & { id: number };
