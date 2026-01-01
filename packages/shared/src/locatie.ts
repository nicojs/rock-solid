import { Adres, UpsertableAdres } from './adres.js';
import { Options } from './options.js';
import { Upsertable } from './upsertable.js';
import { Labels, Prettify, Queryfied, tryParseBoolean } from './util.js';

export type Locatiesoort = 'cursushuis' | 'opstapplaats';

export interface Locatie {
  id: number;
  naam: string;
  adres?: Adres;
  opmerking?: string;
  soort: Locatiesoort;
  geschiktVoorVakantie?: boolean;
}

export const locatiesoorten: Options<Locatiesoort> = Object.freeze({
  cursushuis: 'Cursushuis',
  opstapplaats: 'Opstapplaats',
});

export type UpsertableLocatie = Prettify<
  Upsertable<Omit<Locatie, 'adres'>, 'naam' | 'soort'> & {
    adres?: UpsertableAdres;
  }
>;

export type LocatieFilter = Partial<Pick<Locatie, 'naam' | 'soort' | 'geschiktVoorVakantie'>>;

export const locatieLabels: Labels<Locatie> = {
  id: 'id',
  naam: 'Naam',
  adres: 'Adres',
  opmerking: 'Opmerking',
  soort: 'Soort',
  geschiktVoorVakantie: 'Geschikte opstapplaats voor vakanties',
};

export function toLocatieFilter(query: Queryfied<LocatieFilter>): LocatieFilter {
  return {
    naam: query.naam,
    soort: query.soort,
    geschiktVoorVakantie: tryParseBoolean(query.geschiktVoorVakantie),
  };
}
