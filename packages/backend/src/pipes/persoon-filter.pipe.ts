import { PersoonFilter, OverigPersoonSelectie } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { filterMetaQuery, Flat } from './pipe-utils.js';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Flat<PersoonFilter>): PersoonFilter {
    if (value.searchType === 'persoon') {
      const { selectie, ...filter } = value;
      return {
        ...filterMetaQuery(filter),
        selectie: selectie?.split(',') as OverigPersoonSelectie[],
      } as PersoonFilter;
    }
    return value;
  }
}
