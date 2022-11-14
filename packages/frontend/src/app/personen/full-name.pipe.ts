import { UpsertablePersoon } from '@rock-solid/shared';

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
    persoon.geboortedatum ? ` (${age(persoon.geboortedatum, now)})` : ''
  }`;
}

export function age(geboortedatum: Date, now = new Date()) {
  const then = geboortedatum;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    today.getFullYear() -
    then.getFullYear() -
    (today.valueOf() >=
    new Date(today.getFullYear(), then.getMonth(), then.getDate()).valueOf()
      ? 0
      : 1)
  );
}
