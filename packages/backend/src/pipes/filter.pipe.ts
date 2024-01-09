import {
  CursusLocatieFilter,
  OrganisatieFilter,
  Queryfied,
  toCursusLocatieFilter,
  toOrganisatieFilter,
} from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class CursusLocatieFilterPipe implements PipeTransform {
  transform(value: Queryfied<CursusLocatieFilter>): CursusLocatieFilter {
    return toCursusLocatieFilter(value);
  }
}

@Injectable()
export class OrganisatieFilterPipe implements PipeTransform {
  transform(value: Queryfied<OrganisatieFilter>): OrganisatieFilter {
    return toOrganisatieFilter(value);
  }
}

