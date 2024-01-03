import { PersoonFilter, toPersoonFilter } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { Queryfied } from './pipe-utils.js';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Queryfied<PersoonFilter>): PersoonFilter {
    return toPersoonFilter(value);
  }
}
