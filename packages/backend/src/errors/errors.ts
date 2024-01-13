import { UnprocessableEntityException } from '@nestjs/common';
import { UnprocessableEntityBody } from '@rock-solid/shared';

export class UniqueKeyFailedError<T> extends UnprocessableEntityException {
  constructor(public readonly fields: ReadonlyArray<keyof T & string>) {
    const errorBody: UnprocessableEntityBody<T> = {
      status: 'uniqueness_failed',
      fields,
    };
    super(errorBody);
  }
}
