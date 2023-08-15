import { Aanmeldingsstatus } from './aanmelding.js';
import { Options } from './options.js';
import { Organisatieonderdeel, ProjectType } from './project.js';

export type AanmeldingReportType =
  | 'aanmeldingen'
  | 'deelnames'
  | 'deelnemersuren';

export const aanmeldingReportTypes: Options<AanmeldingReportType> =
  Object.freeze({
    aanmeldingen: 'Aanmeldingen',
    deelnames: 'Deelnames',
    deelnemersuren: 'Deelnemersuren',
  });

export function isAanmeldingReportType(
  maybe: string,
): maybe is AanmeldingReportType {
  return maybe in aanmeldingReportTypes;
}

export type Report = GroupedReport[];

export interface ReportRow {
  key: string;
  count: number;
}

export interface GroupedReport {
  key: string;
  rows?: ReportRow[];
  total: number;
}

export type AanmeldingGroupField =
  | 'jaar'
  | 'provincie'
  | 'woonsituatie'
  | 'geslacht'
  | 'werksituatie'
  | 'organisatieonderdeel'
  | 'project';
export const aanmeldingGroupingFieldOptions: Options<AanmeldingGroupField> = {
  project: 'Project',
  jaar: 'Jaar',
  provincie: 'Provincie',
  woonsituatie: 'Woonsituatie',
  werksituatie: 'Werksituatie',
  geslacht: 'Geslacht',
  organisatieonderdeel: 'Organisatieonderdeel',
};

export interface AanmeldingReportFilter {
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
