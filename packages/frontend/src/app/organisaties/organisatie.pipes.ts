import { UpsertableOrganisatie } from '@rock-solid/shared';

export function printOrganisatie(organisatie: UpsertableOrganisatie) {
  return `${organisatie.naam}`;
}
