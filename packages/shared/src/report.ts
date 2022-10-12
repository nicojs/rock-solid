import { Options } from './options';

export type InschrijvingenReport = GroupedReport[];
export type DeelnamesReport = GroupedReport[];

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
  | 'organisatieonderdeel';
export const groupingFieldOptions: Options<GroupField> = {
  jaar: 'Jaar',
  provincie: 'Provincie',
  woonsituatie: 'Woonsituatie',
  werksituatie: 'Werksituatie',
  geslacht: 'Geslacht',
  organisatieonderdeel: 'Organisatie',
};
