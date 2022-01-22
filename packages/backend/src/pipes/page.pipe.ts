import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PagePipe implements PipeTransform<string, number | undefined> {
  transform(value: string | undefined): number | undefined {
    if (value) {
      const val = parseInt(value, 10);
      if (isFinite(val)) {
        return val;
      }
      throw new BadRequestException('Validation failed');
    }
    return undefined;
  }
}
