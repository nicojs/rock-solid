import { Deelnemer } from './persoon';
import { Upsertable } from './upsertable';

export interface Deelname {
  id: number;
  activiteitId: number;
  deelnemerId: number;
  deelnemer: Deelnemer;
  effectieveDeelnamePerunage: number;
}

export type UpsertableDeelname = Upsertable<
  Deelname,
  'activiteitId' | 'deelnemerId' | 'effectieveDeelnamePerunage'
>;
