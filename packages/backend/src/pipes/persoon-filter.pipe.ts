import { PersoonFilter, OverigPersoonSelectie } from '@kei-crm/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { Flat } from './pipe-utils';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Flat<PersoonFilter>): PersoonFilter {
    if (value.searchType === 'persoon') {
      const { selectie, ...filter } = value;
      return {
        ...Object.entries(filter)
          .filter(([key]) => !key.startsWith('_'))
          .reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
          }, {} as Record<string, string>),
        selectie: selectie?.split(',') as OverigPersoonSelectie[],
      } as PersoonFilter;
    }
    return value;
  }
}
