import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RequiredPipe<T> implements PipeTransform<T | undefined, T> {
  transform(value: T | undefined): T {
    if (value === undefined) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}
