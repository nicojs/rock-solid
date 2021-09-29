import { Upsertable } from './upsertable';

export interface BaseProject {
  id: number;
  projectnummer: string;
  type: ProjectType;
}

export enum ProjectType {
  cursus = 'cursus',
  vakantie = 'vakantie',
}

export interface Cursus extends BaseProject {
  type: ProjectType.cursus;
}

export type Project = Cursus;

export type UpsertableProject = Upsertable<Project, 'projectnummer' | 'type'>;
