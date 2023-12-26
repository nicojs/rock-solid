import {
  PersoonFilter,
  OverigPersoonSelectie,
  Foldersoort,
} from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { filterMetaQuery, Queryfied, tryParseInt } from './pipe-utils.js';

@Injectable()
export class PersoonFilterPipe implements PipeTransform {
  transform(value: Queryfied<PersoonFilter>): PersoonFilter {
    const {
      selectie,
      foldersoorten,
      laatsteAanmeldingJaarGeleden,
      minLeeftijd,
      maxLeeftijd,
      ...filter
    } = value;
    return {
      ...filterMetaQuery(filter),
      selectie: selectie?.split(',') as OverigPersoonSelectie[],
      foldersoorten: foldersoorten?.split(',') as Foldersoort[],
      ...{
        laatsteAanmeldingJaarGeleden: tryParseInt(laatsteAanmeldingJaarGeleden),
        minLeeftijd: tryParseInt(minLeeftijd),
        maxLeeftijd: tryParseInt(maxLeeftijd),
      },
    } as PersoonFilter;
  }
}
