import { Locatie } from './locatie.js';
import { OverigPersoon } from './persoon.js';

export interface Vervoerstoer {
  id: number;
  projectIds: number[];
  naam: string;
  routes: VervoerstoerRoute[];
}

export interface VervoerstoerRoute {
  id: number;
  stops: VervoerstoerStop[];
  chauffeur: OverigPersoon;
}

export interface VervoerstoerStop {
  id: number;
  locatie: Locatie;
  volgnummer: number;
}
