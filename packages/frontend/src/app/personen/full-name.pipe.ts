import { Geslacht, UpsertablePersoon, calculateAge } from '@rock-solid/shared';

export function fullNameOrOnbekend(
  persoon?: Pick<UpsertablePersoon, 'achternaam' | 'voornaam'>,
) {
  return persoon ? fullName(persoon) : 'Onbekend';
}

export function fullName(
  persoon: Pick<UpsertablePersoon, 'achternaam' | 'voornaam'>,
) {
  return persoon.voornaam
    ? `${persoon.voornaam} ${persoon.achternaam}`
    : persoon.achternaam;
}

export function fullNameWithAge(
  persoon: Pick<UpsertablePersoon, 'achternaam' | 'voornaam' | 'geboortedatum'>,
  now = new Date(),
) {
  return `${fullName(persoon)}${
    persoon.geboortedatum
      ? ` (${calculateAge(persoon.geboortedatum, now)})`
      : ''
  }`;
}

export const geslachtIcons: Record<Geslacht, string> = {
  man: 'genderMale',
  vrouw: 'genderFemale',
  x: 'genderTrans',
  onbekend: 'genderAmbiguous',
};
