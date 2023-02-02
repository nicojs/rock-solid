import { Options } from './options';
import { Organisatieonderdeel, ProjectType } from './project';

export type AanmeldingenReportType =
  | 'aanmeldingen'
  | 'deelnames'
  | 'deelnemersuren';

export const aanmeldingenReportTypes: Options<AanmeldingenReportType> =
  Object.freeze({
    aanmeldingen: 'Aanmeldingen',
    deelnames: 'Deelnames',
    deelnemersuren: 'Deelnemersuren',
    vormingsuren: 'Vormingsuren',
  });

export function isAanmeldingenReportType(
  maybe: string,
): maybe is AanmeldingenReportType {
  return maybe in aanmeldingenReportTypes;
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
