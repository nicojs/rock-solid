import { PersoonFilter, OverigPersoonSelectie } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { filterMetaQuery, Queryfied } from './pipe-utils.js';
import { Foldersoort } from '@prisma/client';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Queryfied<PersoonFilter>): PersoonFilter {
    if (value.searchType === 'persoon') {
      const {
        selectie,
        foldersoorten,
        laatsteAanmeldingJaarGeleden,
        ...filter
      } = value;
      return {
        ...filterMetaQuery(filter),
        selectie: selectie?.split(',') as OverigPersoonSelectie[],
        foldersoorten: foldersoorten?.split(',') as Foldersoort[],
        ...{
          laatsteAanmeldingJaarGeleden:
            laatsteAanmeldingJaarGeleden === undefined
              ? undefined
              : parseInt(laatsteAanmeldingJaarGeleden),
        },
      } as PersoonFilter;
    }
    return value;
  }
}
