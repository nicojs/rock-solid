import { Plaats } from './plaats.js';
import { Upsertable } from './upsertable.js';

export interface Adres {
  id: number;
  plaats: Plaats;
  straatnaam: string;
  huisnummer: string;
  busnummer?: string;
}

export type UpsertableAdres = Upsertable<
  Adres,
  'plaats' | 'huisnummer' | 'straatnaam'
>;

