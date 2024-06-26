import { Aanmeldingsstatus } from './aanmelding.js';
import { Options } from './options.js';
import {
  CursusCategorie,
  Doelgroep,
  Organisatieonderdeel,
  ProjectType,
} from './project.js';

export type AanmeldingReportType =
  | 'aanmeldingen'
  | 'deelnames'
  | 'deelnemersuren'
  | 'deelnemersurenPrognose';

export type ActiviteitReportType = 'vormingsuren' | 'begeleidingsuren';

export const aanmeldingReportTypes: Options<AanmeldingReportType> =
  Object.freeze({
    aanmeldingen: 'Aanmeldingen',
    deelnames: 'Deelnames',
    deelnemersuren: 'Deelnemersuren',
    deelnemersurenPrognose: 'Deelnemersuren Prognose',
  });

export const activiteitReportTypes: Options<ActiviteitReportType> =
  Object.freeze({
    vormingsuren: 'Vormingsuren',
    begeleidingsuren: 'Begeleidingsuren',
  });

export function isAanmeldingReportType(
  maybe: string,
): maybe is AanmeldingReportType {
  return maybe in aanmeldingReportTypes;
}

export function isActiviteitReportType(
  maybe: string,
): maybe is ActiviteitReportType {
  return maybe in activiteitReportTypes;
}

export type Report = GroupedReport[];

export interface ReportRow {
  key?: string;
  count: number;
}

export interface GroupedReport {
  key?: string;
  rows?: ReportRow[];
  total: number;
}

export type AanmeldingGroupField =
  | 'provincie'
  | 'woonsituatie'
  | 'geslacht'
  | 'werksituatie'
  | 'categorie'
  | ActiviteitGroupField;

export type ActiviteitGroupField = 'jaar' | 'organisatieonderdeel' | 'project';
export const activiteitGroupingFieldOptions: Options<ActiviteitGroupField> = {
  project: 'Project',
  jaar: 'Jaar',
  organisatieonderdeel: 'Organisatieonderdeel',
};
export const aanmeldingGroupingFieldOptions: Options<AanmeldingGroupField> = {
  provincie: 'Provincie',
  woonsituatie: 'Woonsituatie',
  werksituatie: 'Werksituatie',
  geslacht: 'Geslacht',
  categorie: 'Categorie',
  ...activiteitGroupingFieldOptions,
};

export function isActiviteitGroupingField(
  maybe: string,
): maybe is ActiviteitGroupField {
  return maybe in activiteitGroupingFieldOptions;
}

export interface AanmeldingReportFilter extends ActiviteitReportFilter {
  enkelEersteAanmeldingen?: boolean;
  aanmeldingsstatus?: Aanmeldingsstatus;
}

export interface ActiviteitReportFilter {
  organisatieonderdeel?: Organisatieonderdeel;
  type?: ProjectType;
  jaar?: number;
  doelgroepen?: Doelgroep[];
  categorieen?: CursusCategorie[];
}
