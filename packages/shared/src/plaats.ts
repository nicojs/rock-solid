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

export function plaatsToString(
  plaats?: Pick<Plaats, 'postcode' | 'deelgemeente' | 'gemeente' | 'land'>,
): string {
  if (plaats) {
    const { postcode, deelgemeente, gemeente, land } = plaats;
    return `${postcode ? `${postcode}, ` : ''}${deelgemeente}${deelgemeente === gemeente ? '' : ` (${gemeente})`}${land === 'België' ? '' : `, ${land}`}`;
  } else {
    return '';
  }
}
