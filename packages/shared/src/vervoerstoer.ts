import { Aanmelding } from './aanmelding.js';
import { Adres } from './adres.js';
import { Locatie } from './locatie.js';
import { OverigPersoon } from './persoon.js';

export interface Vervoerstoer {
  id: number;
  projectIds: number[];
  naam: string;
  routes: VervoerstoerRoute[];
  bestemming?: Locatie;
  aangemaaktDoor: string;
}

export type UpsertableVervoerstoer = Omit<
  Vervoerstoer,
  'id' | 'naam' | 'aangemaaktDoor' | 'routes'
> & {
  id?: number;
  routes: UpsertableVervoerstoerRoute[];
};

export interface VervoerstoerRoute {
  id: number;
  stops: VervoerstoerStop[];
  chauffeur: OverigPersoon;
  vertrekTijd?: Date;
  vertrekadres?: Adres;
}

export type UpsertableVervoerstoerRoute = Omit<VervoerstoerRoute, 'id' | 'stops'> & {
  id?: number;
  stops: UpsertableVervoerstoerStop[];
};

export interface VervoerstoerStop {
  id: number;
  locatie: Locatie;
  volgnummer: number;
  aanmeldersOpTePikken: Aanmelding[];
  geplandeAankomst?: Date;
}

export type UpsertableVervoerstoerStop = Omit<VervoerstoerStop, 'id'> & {
  id?: number;
};

export interface VervoerstoerFilter {
  projectIds?: number[];
}

export function toVervoerstoerFilter(
  query: Record<string, string | undefined>,
): VervoerstoerFilter {
  return {
    projectIds: query['projectIds']
      ?.split(',')
      .map(Number)
      .filter(isFinite),
  };
}
