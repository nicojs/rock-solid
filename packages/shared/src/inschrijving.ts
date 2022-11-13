import { Deelnemer } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface Inschrijving {
  id: number;
  projectId: number;
  deelnemerId: number;
  eersteInschrijving: boolean;
  tijdstipVanInschrijving: Date;
  toestemmingFotos: boolean;
  rekeninguittrekselNummer?: string;
  opmerking?: string;
  deelnemer?: Deelnemer;
  wachtlijst: boolean;
}

export type UpsertableInschrijving = Upsertable<
  Inschrijving,
  'deelnemerId' | 'projectId'
>;
