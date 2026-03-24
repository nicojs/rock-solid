import { Queryfied } from './util.js';

export interface Plaats {
  id: number;
  deelgemeente: string;
  gemeente: string;
  provincie: Provincie;
  postcode: string;
  land: string;
}

export type UpsertablePlaats = Omit<Plaats, 'id'> & { id?: number };

export interface PlaatsFilter {
  search: string;
}

export function toPlaatsFilter(value: Queryfied<PlaatsFilter>): PlaatsFilter {
  return { search: value.search };
}

export type Provincie =
  | 'Onbekend'
  | 'Brussels Hoofdstedelijk Gewest'
  | 'Waals-Brabant'
  | 'Vlaams-Brabant'
  | 'Antwerpen'
  | 'Limburg'
  | 'Luik'
  | 'Namen'
  | 'Henegouwen'
  | 'Luxemburg'
  | 'West-Vlaanderen'
  | 'Oost-Vlaanderen';

export const provincies: Record<Provincie, string> = {
  Onbekend: 'Onbekend',
  Antwerpen: 'Antwerpen',
  'Brussels Hoofdstedelijk Gewest': 'Brussels Hoofdstedelijk Gewest',
  Henegouwen: 'Henegouwen',
  Limburg: 'Limburg',
  Luik: 'Luik',
  Luxemburg: 'Luxemburg',
  Namen: 'Namen',
  'Oost-Vlaanderen': 'Oost-Vlaanderen',
  'Vlaams-Brabant': 'Vlaams-Brabant',
  'West-Vlaanderen': 'West-Vlaanderen',
  'Waals-Brabant': 'Waals-Brabant',
};

export function isProvincie(maybe: string): maybe is Provincie {
  return Object.hasOwn(provincies, maybe);
}

export function toProvincie(belgiumPostCode: string): Provincie {
  const postnr = parseInt(belgiumPostCode);
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

export function plaatsToString(
  plaats?: Pick<Plaats, 'postcode' | 'deelgemeente' | 'gemeente' | 'land'>,
): string {
  if (plaats) {
    const { postcode, deelgemeente, gemeente, land } = plaats;
    return `${postcode ? `${postcode} ` : ''}${deelgemeente}${deelgemeente === gemeente ? '' : ` (${gemeente})`}${land === 'België' ? '' : `, ${land}`}`;
  } else {
    return '';
  }
}
