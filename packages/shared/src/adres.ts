import { Upsertable } from './upsertable';

export enum Provincie {
  'Brussels Hoofdstedelijk Gewest' = 1,
  'Waals-Brabant' = 2,
  'Vlaams-Brabant' = 3,
  Antwerpen = 4,
  Limburg = 5,
  Luik = 6,
  Namen = 7,
  Henegouwen = 8,
  Luxemburg = 9,
  'West-Vlaanderen' = 10,
  'Oost-Vlaanderen' = 11,
}

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
