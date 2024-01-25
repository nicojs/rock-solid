import { Upsertable } from './upsertable.js';

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
  'Brussels Hoofdstedelijk Gewest': 'Brussels Hoofdstedelijk Gewest',
  'Waals-Brabant': 'Waals-Brabant',
  'Vlaams-Brabant': 'Vlaams-Brabant',
  Antwerpen: 'Antwerpen',
  Limburg: 'Limburg',
  Luik: 'Luik',
  Namen: 'Namen',
  Henegouwen: 'Henegouwen',
  Luxemburg: 'Luxemburg',
  'West-Vlaanderen': 'West-Vlaanderen',
  'Oost-Vlaanderen': 'Oost-Vlaanderen',
};

export interface Plaats {
  id: number;
  deelgemeente: string;
  gemeente: string;
  provincie: Provincie;
  postcode: string;
}

export interface PlaatsFilter {
  search: string;
}

export interface Adres {
  id: number;
  plaats: Plaats;
  straatnaam: string;
  huisnummer: string;
  busnummer?: string;
}

export type UpsertableAdres = Upsertable<
  Adres,
  'plaats' | 'huisnummer' | 'busnummer' | 'straatnaam'
>;
