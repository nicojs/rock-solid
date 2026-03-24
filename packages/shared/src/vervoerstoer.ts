import { Aanmelding } from './aanmelding.js';
import { Adres, UpsertableAdres } from './adres.js';
import { Locatie } from './locatie.js';
import { OverigPersoon } from './persoon.js';

export interface Vervoerstoer {
  id: number;
  projectIds: number[];
  naam: string;
  routes: VervoerstoerRoute[];
  toeTeKennenStops: VervoerstoerStop[];
  bestemmingStop?: VervoerstoerStop;
  datum?: Date;
  datumTerug?: Date;
  aangemaaktDoor: string;
  compleet: boolean;
}

export type UpsertableVervoerstoer = Omit<
  Vervoerstoer,
  'id' | 'naam' | 'aangemaaktDoor' | 'routes' | 'toeTeKennenStops' | 'bestemmingStop' | 'compleet'
> & {
  id?: number;
  routes: UpsertableVervoerstoerRoute[];
  toeTeKennenStops: UpsertableVervoerstoerStop[];
  bestemmingStop?: UpsertableVervoerstoerStop;
};

export interface VervoerstoerRoute {
  id: number;
  stops: VervoerstoerStop[];
  chauffeur: OverigPersoon;
  vertrekTijd?: Date;
  vertrekTijdTerug?: Date;
  vertrekadres?: Adres;
}

export type UpsertableVervoerstoerRoute = Omit<
  VervoerstoerRoute,
  'id' | 'stops' | 'vertrekadres'
> & {
  id?: number;
  stops: UpsertableVervoerstoerStop[];
  vertrekadres?: UpsertableAdres;
};

export interface VervoerstoerStop {
  id: number;
  locatie: Locatie;
  volgnummer: number;
  aanmeldersOpTePikken: Aanmelding[];
  geplandeAankomst?: Date;
  geplandeAankomstTerug?: Date;
}

export type UpsertableVervoerstoerStop = Omit<VervoerstoerStop, 'id'> & {
  id?: number;
};

export interface VervoerstoerFilter {
  projectIds?: number[];
  naamLike?: string;
  bestemmingLike?: string;
  aangemaaktDoorLike?: string;
}

export function toVervoerstoerFilter(
  query: Record<string, string | undefined>,
): VervoerstoerFilter {
  return {
    projectIds: query['projectIds']
      ?.split(',')
      .map(Number)
      .filter(isFinite),
    naamLike: query['naamLike'],
    bestemmingLike: query['bestemmingLike'],
    aangemaaktDoorLike: query['aangemaaktDoorLike'],
  };
}
