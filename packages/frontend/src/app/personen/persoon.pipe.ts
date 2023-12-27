import {
  Contactpersoon,
  FotoToestemming,
  Geslacht,
  Persoon,
  UpsertablePersoon,
  calculateAge,
  fotoToestemmingLabels,
  notEmpty,
} from '@rock-solid/shared';
import { notAvailable, show } from '../shared';
import { html } from 'lit';

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

export function showPhoneNumber(
  phoneNumber?: string,
  additionalCssClass?: string,
) {
  if (!phoneNumber) {
    return html`<span class=${additionalCssClass}>${notAvailable}</span>`;
  }
  return html`<a class=${additionalCssClass} href="tel:${phoneNumber}"
    >${phoneNumber}</a
  >`;
}

export function showEmail(email?: string, additionalCssClass?: string) {
  if (!email) {
    return html`<span class=${additionalCssClass}>${notAvailable}</span>`;
  }
  return html`<a class=${additionalCssClass} href="mailto:${email}"
    >${email}</a
  >`;
}
export function showContactpersoon(contactpersoon: Contactpersoon) {
  if (Object.values(contactpersoon).every((v) => !v)) {
    return notAvailable;
  }
  return html`<rock-icon icon="person"></rock-icon
    ><span class="me-2">${show(contactpersoon.naam)}</span> 📧
    ${showEmail(contactpersoon.email, 'me-2')}
    <rock-icon icon="telephone"></rock-icon>
    ${showPhoneNumber(contactpersoon.telefoon, 'me-2')}</span>
    <rock-icon icon="phone"></rock-icon>
    ${showPhoneNumber(contactpersoon.gsm)}`;
}

export function showVoedingswens({
  voedingswens,
  voedingswensOpmerking,
}: Pick<Persoon, 'voedingswens' | 'voedingswensOpmerking'>) {
  return [
    voedingswens === 'geen' ? undefined : voedingswens,
    voedingswensOpmerking,
  ]
    .filter(notEmpty)
    .join(': ');
}

export function showFotoToestemming(toestemming: FotoToestemming): string {
  switch (determineFotoToestemmingKind(toestemming)) {
    case 'all':
      return 'Alle doeleinden';
    case 'none':
      return 'Geen doeleinden';
    case 'some':
      return `Sommigen: ${Object.keys(fotoToestemmingLabels)
        .map((key) => toestemmingWhenAllowed(key as keyof FotoToestemming))
        .filter(notEmpty)
        .join(', ')}`;
  }

  function toestemmingWhenAllowed(toestemmingKey: keyof FotoToestemming) {
    return toestemming[toestemmingKey]
      ? fotoToestemmingLabels[toestemmingKey]
      : undefined;
  }
}

export function determineFotoToestemmingKind(
  toestemming: FotoToestemming,
): 'all' | 'none' | 'some' {
  const toestemmingValues = Object.keys(fotoToestemmingLabels).map(
    (key) => toestemming[key as keyof FotoToestemming],
  );
  if (toestemmingValues.every((value) => value === true)) {
    return 'all';
  }
  if (toestemmingValues.every((value) => value === false)) {
    return 'none';
  }
  return 'some';
}

export const geslachtIcons: Record<Geslacht, string> = {
  man: 'genderMale',
  vrouw: 'genderFemale',
  x: 'genderTrans',
  onbekend: 'questionCircle',
};
