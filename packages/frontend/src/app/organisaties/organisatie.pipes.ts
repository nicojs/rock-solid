import { UpsertableOrganisatie } from '@kei-crm/shared';

export function printOrganisatie(organisatie: UpsertableOrganisatie) {
  return `${organisatie.naam}`;
}
