import {
  OrganisatieFilter,
  Queryfied,
  toOrganisatieFilter,
} from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class OrganisatieFilterPipe implements PipeTransform {
  transform(value: Queryfied<OrganisatieFilter>): OrganisatieFilter {
    return toOrganisatieFilter(value);
  }
}
