import { PersoonFilter, OverigPersoonSelectie } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { filterMetaQuery, Flat } from './pipe-utils.js';
import { Foldersoort } from '@prisma/client';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Flat<PersoonFilter>): PersoonFilter {
    if (value.searchType === 'persoon') {
      const { selectie, foldersoorten, ...filter } = value;
      return {
        ...filterMetaQuery(filter),
        selectie: selectie?.split(',') as OverigPersoonSelectie[],
        foldersoorten: foldersoorten?.split(',') as Foldersoort[],
      } as PersoonFilter;
    }
    return value;
  }
}
