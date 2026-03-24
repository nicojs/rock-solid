import { UpsertablePlaats, toProvincie } from '@rock-solid/shared';

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
): UpsertablePlaats | undefined {
  if (!parsed.postcode || !parsed.deelgemeente || !parsed.land) {
    return undefined;
  }
  const provincie =
    parsed.land === 'België' ? toProvincie(parsed.postcode) : 'Onbekend';
  return {
    deelgemeente: parsed.deelgemeente,
    gemeente: parsed.gemeente || parsed.deelgemeente,
    postcode: parsed.postcode,
    land: parsed.land,
    provincie,
  };
}
