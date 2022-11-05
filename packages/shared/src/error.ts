export interface UnprocessableEntityBody {
  status: 'uniqueness_failed';
  readonly fields: readonly string[];
}
