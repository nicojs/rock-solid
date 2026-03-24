import { Provincie, UpsertablePlaats } from '@rock-solid/shared';

export function toProvincie(postCode: string): Provincie {
  const postnr = parseInt(postCode);
  if (postnr >= 1000 && postnr <= 1299) return 'Brussels Hoofdstedelijk Gewest';
  if (postnr >= 1300 && postnr <= 1499) return 'Waals-Brabant';
  if (
    (postnr >= 1500 && postnr <= 1999) ||
    (postnr >= 3000 && postnr <= 3499)
  )
    return 'Vlaams-Brabant';
  if (postnr >= 2000 && postnr <= 2999) return 'Antwerpen';
  if (postnr >= 3500 && postnr <= 3999) return 'Limburg';
  if (postnr >= 4000 && postnr <= 4999) return 'Luik';
  if (postnr >= 5000 && postnr <= 5999) return 'Namen';
  if (
    (postnr >= 6000 && postnr <= 6599) ||
    (postnr >= 7000 && postnr <= 7999)
  )
    return 'Henegouwen';
  if (postnr >= 6600 && postnr <= 6999) return 'Luxemburg';
  if (postnr >= 8000 && postnr <= 8999) return 'West-Vlaanderen';
  if (postnr >= 9000 && postnr <= 9999) return 'Oost-Vlaanderen';
  return 'Onbekend';
}

interface ParsedComponents {
  straatnaam: string;
  huisnummer: string;
  deelgemeente: string;
  gemeente: string;
  postcode: string;
  land: string;
}

export function parseAddressComponents(
  components: google.maps.places.AddressComponent[],
): ParsedComponents {
  let straatnaam = '';
  let huisnummer = '';
  let deelgemeente = '';
  let gemeente = '';
  let postcode = '';
  let land = '';

  for (const comp of components) {
    const types = comp.types;
    if (types.includes('route')) {
      straatnaam = comp.longText ?? '';
    } else if (types.includes('street_number')) {
      huisnummer = comp.longText ?? '';
    } else if (
      types.includes('sublocality') ||
      types.includes('sublocality_level_1')
    ) {
      deelgemeente = comp.longText ?? '';
    } else if (types.includes('locality')) {
      if (!deelgemeente) deelgemeente = comp.longText ?? '';
      gemeente = comp.longText ?? '';
    } else if (types.includes('postal_code')) {
      postcode = comp.longText ?? '';
    } else if (types.includes('country')) {
      land = comp.longText ?? '';
    } else if (types.includes('administrative_area_level_1')) {
      if (!gemeente) gemeente = comp.longText ?? '';
    }
  }

  if (!deelgemeente && gemeente) deelgemeente = gemeente;
  if (!gemeente && deelgemeente) gemeente = deelgemeente;

  return { straatnaam, huisnummer, deelgemeente, gemeente, postcode, land };
}

export function toUpsertablePlaats(
  parsed: Pick<
    ParsedComponents,
    'deelgemeente' | 'gemeente' | 'postcode' | 'land'
  >,
): UpsertablePlaats {
  const provincie =
    parsed.land === 'België' ? toProvincie(parsed.postcode) : 'Onbekend';
  return {
    deelgemeente: parsed.deelgemeente,
    gemeente: parsed.gemeente,
    postcode: parsed.postcode,
    land: parsed.land || 'Onbekend',
    provincie,
  };
}
