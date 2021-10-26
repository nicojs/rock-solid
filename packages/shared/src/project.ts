import { Options } from './options';
import { Upsertable } from './upsertable';

export interface BaseProject {
  id: number;
  projectnummer: string;
  type: ProjectType;
  activiteiten: Activiteit[];
  naam: string;
  aantalInschrijvingen?: number;
}

export type ProjectType = 'cursus' | 'vakantie';

export interface Cursus extends BaseProject {
  type: 'cursus';
  organisatieonderdeel: Organisatieonderdeel;
  overnachting: boolean;
}

export interface Vakantie extends BaseProject {
  type: 'vakantie';
}

export interface Activiteit {
  id: number;
  van: Date;
  totEnMet: Date;
  vormingsuren?: number;
  aantalDeelnames?: number;
  aantalDeelnemersuren?: number;
}

export type Organisatieonderdeel = 'keiJongBuSO' | 'keiJongNietBuSO' | 'deKei';

export const bedrijfsonderdelen: Options<Organisatieonderdeel> = Object.freeze({
  deKei: 'de KEI',
  keiJongBuSO: 'KEI-JONG BuSO',
  keiJongNietBuSO: 'KEI-JONG niet BuSO',
});

export type Project = Cursus | Vakantie;

export type UpsertableActiviteit = Upsertable<Activiteit, 'van' | 'totEnMet'>;

export type UpsertableProject = Upsertable<
  Omit<Project, 'activiteiten'>,
  'projectnummer' | 'type' | 'naam'
> & {
  activiteiten: UpsertableActiviteit[];
};
