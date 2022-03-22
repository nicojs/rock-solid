import { Persoon } from '.';
import { Upsertable } from './upsertable';

export interface Inschrijving {
  id: number;
  projectId: number;
  deelnemerId: number;
  tijdstipVanInschrijving: Date;
  tijdstipVanBevestiging?: Date;
  tijdstipVerzendenVervoersbrief?: Date;
  toestemmingFotos: boolean;
  opmerking?: string;
  deelnemer?: Persoon;
  wachtlijst: boolean;
}

export type UpsertableInschrijving = Upsertable<
  Inschrijving,
  'deelnemerId' | 'projectId'
>;
