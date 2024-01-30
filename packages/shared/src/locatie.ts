import { Adres, UpsertableAdres } from './adres.js';
import { Upsertable } from './upsertable.js';
import { Labels, Queryfied } from './util.js';

export interface Locatie {
  id: number;
  naam: string;
  adres?: Adres;
  opmerking?: string;
}

export type UpsertableLocatie = Upsertable<Omit<Locatie, 'adres'>, 'naam'> & {
  adres?: UpsertableAdres;
};

export type LocatieFilter = Partial<Pick<Locatie, 'naam'>>;

export const locatieLabels: Labels<Locatie> = {
  id: 'id',
  naam: 'Naam',
  adres: 'Adres',
  opmerking: 'Opmerking',
};

export function toLocatieFilter(query: Queryfied<LocatieFilter>) {
  return {
    naam: query.naam,
  };
}
