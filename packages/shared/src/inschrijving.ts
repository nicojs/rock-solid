import { Persoon } from '.';
import { Upsertable } from './upsertable';

export interface Inschrijving {
  id: number;
  projectId: number;
  persoonId: number;
  tijdstipVanInschrijving: Date;
  tijdstipVanBevestiging?: Date;
  tijdstipVerzendenVervoersbrief?: Date;
  toestemmingFotos: boolean;
  opmerking?: string;
  persoon?: Persoon;
  wachtlijst: boolean;
}

export type UpsertableInschrijving = Upsertable<
  Inschrijving,
  'persoonId' | 'projectId'
>;
