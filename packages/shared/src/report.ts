import { Aanmeldingsstatus } from './aanmelding.js';
import { Options } from './options.js';
import { Organisatieonderdeel, ProjectType } from './project.js';

export type ProjectenReportType =
  | 'aanmeldingen'
  | 'deelnames'
  | 'deelnemersuren';

export const projectenReportTypes: Options<ProjectenReportType> = Object.freeze(
  {
    aanmeldingen: 'Aanmeldingen',
    deelnames: 'Deelnames',
    deelnemersuren: 'Deelnemersuren',
    vormingsuren: 'Vormingsuren',
  },
);

export function isProjectReportType(
  maybe: string,
): maybe is ProjectenReportType {
  return maybe in projectenReportTypes;
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
  enkelEersteAanmeldingen?: boolean;
  organisatieonderdeel?: Organisatieonderdeel;
  type?: ProjectType;
  jaar?: number;
  overnachting?: OvernachtingDescription;
  aanmeldingsstatus?: Aanmeldingsstatus;
}

export type OvernachtingDescription = 'met' | 'zonder';

export const overnachtingDescriptions: Options<OvernachtingDescription> =
  Object.freeze({
    met: 'Enkel met overnachting',
    zonder: 'Enkel zonder overnachting',
  });

export function isOvernachtingDescription(
  maybe: string,
): maybe is OvernachtingDescription {
  return maybe in overnachtingDescriptions;
}
