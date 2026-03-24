import { Labels } from './index.js';
import { Plaats, UpsertablePlaats } from './plaats.js';
import { Upsertable } from './upsertable.js';

export interface Adres {
  id: number;
  plaats: Plaats;
  straatnaam: string;
  huisnummer: string;
  busnummer?: string;
}

export type UpsertableAdres = Omit<
  Upsertable<Adres, 'plaats' | 'huisnummer' | 'straatnaam'>,
  'plaats'
> & { plaats: UpsertablePlaats };

export const adresLabels: Labels<Adres> = {
  id: 'Id',
  straatnaam: 'Straat',
  huisnummer: 'Huisnr.',
  busnummer: 'Busnr.',
  plaats: 'Plaats',
};
