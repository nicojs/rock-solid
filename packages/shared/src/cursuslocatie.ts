import { Adres, UpsertableAdres } from './adres.js';
import { Upsertable } from './upsertable.js';
import { Labels, Queryfied } from './util.js';

export interface CursusLocatie {
  id: number;
  naam: string;
  adres?: Adres;
}

export type UpsertableCursusLocatie = Upsertable<
  Omit<CursusLocatie, 'adres'>,
  'naam'
> & { adres?: UpsertableAdres };

export type CursusLocatieFilter = Partial<Pick<CursusLocatie, 'naam'>>;

export const cursusLocatieLabels: Labels<CursusLocatie> = {
  id: 'id',
  naam: 'Naam',
  adres: 'Adres',
};

export function toCursusLocatieFilter(query: Queryfied<CursusLocatieFilter>) {
  return {
    naam: query.naam,
  };
}
