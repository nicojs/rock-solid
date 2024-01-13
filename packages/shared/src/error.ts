export interface UnprocessableEntityBody<T> {
  status: 'uniqueness_failed';
  readonly fields: ReadonlyArray<keyof T & string>;
}
