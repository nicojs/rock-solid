import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class BooleanPipe implements PipeTransform<string, boolean | undefined> {
  transform(value: string): boolean | undefined {
    return value === 'true';
  }
}
