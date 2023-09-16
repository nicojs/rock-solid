import { Plaats } from './adres.js';
import { Options } from './options.js';
import { Deelnemer, Geslacht, Werksituatie, Woonsituatie } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface Aanmelding {
  id: number;
  projectId: number;
  deelnemerId?: number;
  tijdstipVanAanmelden: Date;
  rekeninguittrekselNummer?: string;
  opmerking?: string;
  deelnemer?: Deelnemer;
  werksituatie: Werksituatie;
  woonsituatie: Woonsituatie;
  geslacht: Geslacht;
  plaats?: Plaats;

  status: Aanmeldingsstatus;
}

export type Aanmeldingsstatus =
  | 'Aangemeld'
  | 'Bevestigd'
  | 'OpWachtlijst'
  | 'Geannuleerd';

export const aanmeldingsstatussen: Options<Aanmeldingsstatus> = {
  Aangemeld: 'Aangemeld',
  Bevestigd: 'Bevestigd',
  Geannuleerd: 'Geannuleerd',
  OpWachtlijst: 'Op wachtlijst',
};

export function isAanmeldingsstatus(maybe: string): maybe is Aanmeldingsstatus {
  return maybe in aanmeldingsstatussen;
}

export type InsertableAanmelding = Upsertable<
  Aanmelding,
  'deelnemerId' | 'projectId'
>;

export type UpdatableAanmelding = Upsertable<Aanmelding, 'id'>;

export const aanmeldingLabels: Record<keyof Aanmelding, string> = {
  id: 'id',
  projectId: 'projectId',
  deelnemerId: 'deelnemerId',
  tijdstipVanAanmelden: 'Aanmeldingsdatum',
  rekeninguittrekselNummer: 'Rekeninguittreksel nummer',
  opmerking: 'Opmerking',
  deelnemer: 'Deelnemer',
  plaats: 'Plaats',
  werksituatie: 'Werksituatie',
  woonsituatie: 'Woonsituatie',
  geslacht: 'Geslacht',
  status: 'Status',
};
