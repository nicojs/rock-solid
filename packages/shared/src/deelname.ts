import { Deelnemer } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface Deelname {
  id: number;
  activiteitId: number;
  aanmeldingId: number;
  deelnemer?: Deelnemer;
  effectieveDeelnamePerunage: number;
  opmerking?: string;
}

export type UpsertableDeelname = Upsertable<
  Deelname,
  'aanmeldingId' | 'effectieveDeelnamePerunage'
>;
