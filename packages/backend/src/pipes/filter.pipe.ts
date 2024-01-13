import {
  LocatieFilter,
  OrganisatieFilter,
  Queryfied,
  toLocatieFilter,
  toOrganisatieFilter,
} from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class CursusLocatieFilterPipe implements PipeTransform {
  transform(value: Queryfied<LocatieFilter>): LocatieFilter {
    return toLocatieFilter(value);
  }
}

@Injectable()
export class OrganisatieFilterPipe implements PipeTransform {
  transform(value: Queryfied<OrganisatieFilter>): OrganisatieFilter {
    return toOrganisatieFilter(value);
  }
}
