import { Options } from './options.js';
import { Deelnemer } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface Aanmelding {
  id: number;
  projectId: number;
  deelnemerId?: number;
  eersteAanmelding: boolean;
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
