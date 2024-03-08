import { Plaats } from './adres.js';
import { Options } from './options.js';
import { Deelnemer, Geslacht, Werksituatie, Woonsituatie } from './persoon.js';
import { Patchable, Upsertable } from './upsertable.js';
import { Labels } from './util.js';

export interface Aanmelding {
  id: number;
  projectId: number;
  deelnemerId?: number;
  tijdstipVanAanmelden: Date;
  rekeninguittrekselNummer?: string;
  opmerking?: string;
  deelnemer?: Deelnemer;
  werksituatie?: Werksituatie;
  woonsituatie?: Woonsituatie;
  geslacht?: Geslacht;
  plaats?: Plaats;
  bevestigingsbriefVerzondenOp?: Date;
  vervoersbriefVerzondenOp?: Date;
  status: Aanmeldingsstatus;
  deelnames: Deelname[];
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

export const aanmeldingsstatussenWithoutDeelnames = [
  'Geannuleerd',
  'OpWachtlijst',
  'Aangemeld',
] as Aanmeldingsstatus[];

export function isAanmeldingsstatus(maybe: string): maybe is Aanmeldingsstatus {
  return maybe in aanmeldingsstatussen;
}

export type InsertableAanmelding = Upsertable<
  Aanmelding,
  'deelnemerId' | 'projectId'
>;

export type UpdatableAanmelding = Upsertable<Aanmelding, 'id' | 'status'> & {
  overrideDeelnemerFields?: boolean;
};

export type PatchableAanmelding = Patchable<Aanmelding>;

export const aanmeldingLabels: Labels<Aanmelding> = {
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
  bevestigingsbriefVerzondenOp: 'Bevestigingsbrief verzonden op',
  vervoersbriefVerzondenOp: 'Vervoersbrief verzonden op',
  deelnames: 'Deelnames',
};

export interface Deelname {
  id: number;
  activiteitId: number;
  aanmeldingId: number;
  effectieveDeelnamePerunage: number;
  opmerking?: string;
}

export type UpsertableDeelname = Upsertable<
  Deelname,
  'aanmeldingId' | 'effectieveDeelnamePerunage'
>;
