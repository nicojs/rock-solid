import { PlaatsFilter, toPlaatsFilter } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { Queryfied } from './pipe-utils.js';

@Injectable()
export class PlaatsFilterPipe implements PipeTransform {
  transform(value: Queryfied<PlaatsFilter>): PlaatsFilter {
    return toPlaatsFilter(value);
  }
}
