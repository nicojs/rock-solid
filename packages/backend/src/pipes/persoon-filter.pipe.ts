import { PersoonFilter, VrijwilligerSelectie } from '@kei-crm/shared';
import { PipeTransform, Injectable } from '@nestjs/common';

type Flat<T> = {
  [K in keyof T]: any[] extends T[K] ? string : T[K];
};

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Flat<PersoonFilter>): PersoonFilter {
    if (value.searchType === 'persoon') {
      const { selectie, ...filter } = value;
      return {
        ...filter,
        selectie: selectie?.split(',') as VrijwilligerSelectie[],
      };
    }
    return value;
  }
}
