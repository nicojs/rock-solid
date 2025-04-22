import { Injectable } from '@nestjs/common';
import {
  GroupedReport,
  AanmeldingGroupField,
  Report,
  AanmeldingReportFilter,
  AanmeldingReportType,
  ActiviteitReportFilter,
  ActiviteitReportType,
  ActiviteitGroupField,
} from '@rock-solid/shared';
import { DBService } from './db.service.js';
import {
  aanmeldingsstatusMapper,
  cursusCategorieMapper,
  doelgroepMapper,
  geslachtMapper,
  organisatieonderdeelMapper,
  projectTypeMapper,
  provincieMapper,
  werksituatieMapper,
  woonsituatieMapper,
} from './enum.mapper.js';

@Injectable()
export class ReportMapper {
  activiteiten(
    reportType: ActiviteitReportType,
    groupField: ActiviteitGroupField,
    secondGroupField: ActiviteitGroupField | undefined,
    filter: ActiviteitReportFilter,
  ): Promise<Report> {
    const query = `
    SELECT 
    ${select(groupField)} as key1, 
    ${secondGroupField ? `${select(secondGroupField)} as key2,` : ''} 
    ${activiteitReportAggregator(reportType)} as total
    FROM Activiteit
    INNER JOIN Project ON Project.id = Activiteit.projectId
    ${filterWhere(filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
`;
    return this.execReportQuery(query, groupField, secondGroupField);
  }
  constructor(private db: DBService) {}

  async aanmeldingen(
    reportType: AanmeldingReportType,
    groupField: AanmeldingGroupField,
    secondGroupField: AanmeldingGroupField | undefined,
    filter: AanmeldingReportFilter,
  ): Promise<Report> {
    const query = `
    SELECT 
      ${select(groupField)} as key1, 
      ${secondGroupField ? `${select(secondGroupField)} as key2,` : ''} 
      ${aanmeldingReportAggregator(reportType)} as total
    FROM aanmelding
    INNER JOIN Project ON Aanmelding.projectId = Project.id ${
      filter.type
        ? `AND Project.type = ${projectTypeMapper.toDB(filter.type)}`
        : ''
    }
    ${reportTypeJoin(reportType)}
    LEFT JOIN Persoon ON Persoon.id = Aanmelding.deelnemerId    
    LEFT JOIN Plaats ON Aanmelding.plaatsId = Plaats.id
    ${filterWhere(filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `;
    return this.execReportQuery(query, groupField, secondGroupField);
  }

  private async execReportQuery(
    query: string,
    groupField: AanmeldingGroupField,
    secondGroupField: AanmeldingGroupField | undefined,
  ): Promise<Report> {
    // console.log(query);
    const rawResults = await this.db.$queryRawUnsafe<
      {
        key1: string | number | null;
        key2?: string | number | null;
        total: bigint;
      }[]
    >(query);
    const aanmeldingen: Report = [];
    function newReport(key: string | null | number) {
      const report: GroupedReport = {
        key: keyFromGroupField(groupField, key),
        total: 0,
      };
      aanmeldingen.push(report);
      return report;
    }

    rawResults.forEach((row) => {
      const reportItem =
        aanmeldingen.find((report) => report.key === row.key1) ??
        newReport(row.key1);
      const count = Number(row.total); // save to do, because rock solid deals with small numbers.
      if ('key2' in row) {
        const rows = reportItem.rows ?? [];
        rows.push({
          count,
          key: keyFromGroupField(secondGroupField!, row.key2),
        });
        reportItem.rows = rows;
      }
      reportItem.total += count;
    });
    return aanmeldingen;
  }
}

function reportTypeJoin(reportType: AanmeldingReportType): string {
  switch (reportType) {
    case 'deelnames':
      return 'INNER JOIN deelname ON deelname.aanmeldingId = Aanmelding.id AND deelname.effectieveDeelnamePerunage > 0';
    case 'aanmeldingen':
      return '';
    case 'deelnemersurenPrognose':
    case 'deelnemersuren':
      return `
      INNER JOIN activiteit ON activiteit.projectId = project.id
      ${reportType === 'deelnemersurenPrognose' ? 'LEFT' : 'INNER'} JOIN deelname ON deelname.aanmeldingId = aanmelding.id AND deelname.activiteitId = activiteit.id 
      `;
  }
}

function filterWhere(filter: AanmeldingReportFilter): string {
  const whereClauses: string[] = [];
  if (filter.enkelEersteAanmeldingen) {
    switch (filter.type) {
      case 'cursus':
        whereClauses.push('Aanmelding.id = Persoon.eersteCursusAanmeldingId');
        break;
      case 'vakantie':
        whereClauses.push('Aanmelding.id = persoon.eersteVakantieAanmeldingId');
        break;
      default:
        whereClauses.push(
          'Aanmelding.id IN (persoon.eersteVakantieAanmeldingId, persoon.eersteCursusAanmeldingId)',
        );
        break;
    }
  }
  if (filter.organisatieonderdeel) {
    whereClauses.push(
      `Project.organisatieonderdeel = ${organisatieonderdeelMapper.toDB(
        filter.organisatieonderdeel,
      )}`,
    );
  }
  if (filter.type) {
    whereClauses.push(`Project.type = ${projectTypeMapper.toDB(filter.type)}`);
  }
  if (filter.jaar) {
    whereClauses.push(`Project.jaar = ${filter.jaar}`);
  }
  if (filter.aanmeldingsstatus) {
    whereClauses.push(
      `Aanmelding.status = ${aanmeldingsstatusMapper.toDB(
        filter.aanmeldingsstatus,
      )}`,
    );
  }
  if (filter.doelgroepen && filter.doelgroepen.length) {
    whereClauses.push(
      `Project.doelgroep IN (${filter.doelgroepen.map((doelgroep) => doelgroepMapper.toDB(doelgroep)).join(',')})`,
    );
  }
  if (filter.categorieen && filter.categorieen.length) {
    whereClauses.push(
      `Project.categorie IN (${filter.categorieen.map((categorie) => cursusCategorieMapper.toDB(categorie)).join(',')})`,
    );
  }
  if (whereClauses.length) {
    return `WHERE ${whereClauses.join(' AND ')}`;
  }
  return '';
}
function aanmeldingReportAggregator(reportType: AanmeldingReportType): string {
  switch (reportType) {
    case 'deelnames':
    case 'aanmeldingen':
      return 'COUNT(Aanmelding.id)';
    case 'deelnemersuren':
      return 'SUM(deelname.effectieveDeelnamePerunage * activiteit.vormingsuren)';
    case 'deelnemersurenPrognose':
      return `SUM(CASE WHEN deelname.id IS NULL THEN (CASE WHEN Aanmelding.status IN (${aanmeldingsstatusMapper.toDB(
        'Aangemeld',
      )}, ${aanmeldingsstatusMapper.toDB(
        'Bevestigd',
      )}) THEN COALESCE(activiteit.vormingsuren, 0.0) ELSE 0.0 END) ELSE deelname.effectieveDeelnamePerunage * COALESCE(activiteit.vormingsuren, 0.0) END)`;
  }
}
function activiteitReportAggregator(reportType: ActiviteitReportType): string {
  switch (reportType) {
    case 'vormingsuren':
      return 'SUM(activiteit.vormingsuren)';
    case 'begeleidingsuren':
      return 'SUM(activiteit.begeleidingsuren)';
  }
}

function fieldName(field: AanmeldingGroupField): string {
  switch (field) {
    case 'jaar':
      return 'Project.jaar';
    case 'provincie':
      return 'Plaats.provincieId';
    case 'woonsituatie':
      return 'Aanmelding.woonsituatie';
    case 'werksituatie':
      return 'Aanmelding.werksituatie';
    case 'geslacht':
      return 'Aanmelding.geslacht';
    case 'organisatieonderdeel':
      return 'Project.organisatieonderdeel';
    case 'project':
      return 'Project.id';
    case 'categorie':
      return 'Project.categorie';
  }
}

function select(field: AanmeldingGroupField): string {
  switch (field) {
    case 'jaar':
      return 'jaar';
    case 'provincie':
      return 'provincieId';
    case 'woonsituatie':
      return 'Aanmelding.woonsituatie';
    case 'werksituatie':
      return 'Aanmelding.werksituatie';
    case 'geslacht':
      return 'Aanmelding.geslacht';
    case 'organisatieonderdeel':
      return 'organisatieonderdeel';
    case 'project':
      return 'Project.titel';
    case 'categorie':
      return 'Project.categorie';
  }
}

function keyFromGroupField(
  groupField: AanmeldingGroupField,
  key: string | number | null | undefined,
): string | undefined {
  switch (groupField) {
    case 'woonsituatie':
      return woonsituatieMapper.toSchema(keyAsNumberIfString());
    case 'werksituatie':
      return werksituatieMapper.toSchema(keyAsNumberIfString());
    case 'geslacht':
      return geslachtMapper.toSchema(keyAsNumberIfString());
    case 'organisatieonderdeel':
      return organisatieonderdeelMapper.toSchema(keyAsNumberIfString());
    case 'provincie':
      return provincieMapper.toSchema(keyAsNumberIfString());
    case 'categorie':
      return cursusCategorieMapper.toSchema(keyAsNumberIfString());
    default:
      if (key === null || key === undefined) {
        return undefined;
      }
      return String(key);
  }

  function keyAsNumberIfString(): number | null {
    if (key === null || key === undefined) {
      return null;
    }
    return Number(key);
  }
}
