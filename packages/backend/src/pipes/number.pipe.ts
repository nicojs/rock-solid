import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NumberPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    return +value;
  }
}
