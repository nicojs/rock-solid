import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UnprocessableEntityBody } from '@rock-solid/shared';

export class UniqueKeyFailedError extends UnprocessableEntityException {
  constructor(public readonly fields: readonly string[]) {
    const errorBody: UnprocessableEntityBody = {
      status: 'uniqueness_failed',
      fields,
    };
    super(errorBody);
  }
}

export class RecordNotFoundError extends NotFoundException {}
