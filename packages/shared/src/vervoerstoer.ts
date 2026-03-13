import { Aanmelding } from './aanmelding.js';
import { Locatie } from './locatie.js';
import { OverigPersoon } from './persoon.js';

export interface Vervoerstoer {
  id: number;
  projectIds: number[];
  naam: string;
  routes: VervoerstoerRoute[];
  bestemming?: Locatie;
}

export type UpsertableVervoerstoer = Omit<Vervoerstoer, 'id' | 'naam'> & {
  id?: number;
};

export interface VervoerstoerRoute {
  id: number;
  stops: VervoerstoerStop[];
  chauffeur: OverigPersoon;
}

export interface VervoerstoerStop {
  id: number;
  locatie: Locatie;
  volgnummer: number;
  aanmeldersOpTePikken: Aanmelding[];
  geplandeAankomst?: Date;
}
