import { Options } from './options';
import { Organisatieonderdeel, ProjectType } from './project';

export type ProjectReportType =
  | 'inschrijvingen'
  | 'deelnames'
  | 'deelnemersuren'
  | 'vormingsuren';

export const projectReportTypes: Options<ProjectReportType> = Object.freeze({
  inschrijvingen: 'Inschrijvingen',
  deelnames: 'Deelnames',
  deelnemersuren: 'Deelnemersuren',
  vormingsuren: 'Vormingsuren',
});

export function isProjectReportType(maybe: string): maybe is ProjectReportType {
  return maybe in projectReportTypes;
}

export type ProjectReport = GroupedReport[];

export interface ReportRow {
  key: string;
  count: number;
}

export interface GroupedReport {
  key: string;
  rows?: ReportRow[];
  total: number;
}

export type GroupField =
  | 'jaar'
  | 'provincie'
  | 'woonsituatie'
  | 'geslacht'
  | 'werksituatie'
  | 'organisatieonderdeel'
  | 'project';
export const groupingFieldOptions: Options<GroupField> = {
  project: 'Project',
  jaar: 'Jaar',
  provincie: 'Provincie',
  woonsituatie: 'Woonsituatie',
  werksituatie: 'Werksituatie',
  geslacht: 'Geslacht',
  organisatieonderdeel: 'Organisatieonderdeel',
};

export interface ProjectReportFilter {
  enkelEersteInschrijvingen?: boolean;
  organisatieonderdeel?: Organisatieonderdeel;
  type?: ProjectType;
  jaar?: number;
}
