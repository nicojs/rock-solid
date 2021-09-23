import { UpsertablePersoon } from '@kei-crm/shared';

export function fullName(
  persoon: Pick<UpsertablePersoon, 'achternaam' | 'voornaam'>,
) {
  return persoon.voornaam
    ? `${persoon.voornaam} ${persoon.achternaam}`
    : persoon.achternaam;
}
