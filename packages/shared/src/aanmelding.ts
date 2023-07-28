import { Options } from './options.js';
import { Deelnemer } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface Aanmelding {
  id: number;
  projectId: number;
  deelnemerId?: number;
  tijdstipVanAanmelden: Date;
  toestemmingFotos: boolean;
  rekeninguittrekselNummer?: string;
  opmerking?: string;
  deelnemer?: Deelnemer;
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

export type UpsertableAanmelding = Upsertable<
  Aanmelding,
  'deelnemerId' | 'projectId'
>;

export const aanmeldingLabels: Record<keyof Aanmelding, string> = {
  id: 'id',
  projectId: 'projectId',
  deelnemerId: 'deelnemerId',
  tijdstipVanAanmelden: 'Aanmeldingsdatum',
  toestemmingFotos: "Toestemming voor foto's",
  rekeninguittrekselNummer: 'Rekeninguittreksel nummer',
  opmerking: 'Opmerking',
  deelnemer: 'Deelnemer',
  status: 'Status',
};
