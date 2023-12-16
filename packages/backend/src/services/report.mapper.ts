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
    ${select(groupField)}::text as key1, 
    ${secondGroupField ? `${select(secondGroupField)}::text as key2,` : ''} 
    ${activiteitReportAggregator(reportType)}::int as total
    FROM activiteit
    INNER JOIN project ON project.id = activiteit."projectId"
    ${filterWhere(filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
`;
    return this.execReportQuery(query);
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
      ${select(groupField)}::text as key1, 
      ${secondGroupField ? `${select(secondGroupField)}::text as key2,` : ''} 
      ${aanmeldingReportAggregator(reportType)}::int as total
    FROM aanmelding
    INNER JOIN project ON aanmelding."projectId" = project.id ${
      filter.type ? `AND project.type = '${filter.type}'::project_type` : ''
    }
    ${reportTypeJoin(reportType)}
    LEFT JOIN persoon ON persoon.id = aanmelding."deelnemerId"    
    LEFT JOIN plaats ON aanmelding."plaatsId" = plaats.id
    ${filterWhere(filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `;
    return this.execReportQuery(query);
  }

  private async execReportQuery(query: string): Promise<Report> {
    // console.log(query);
    const rawResults =
      await this.db.$queryRawUnsafe<
        { key1: string; key2?: string; total: number }[]
      >(query);
    const aanmeldingen: Report = [];
    function newReport(key: string) {
      const report: GroupedReport = {
        key,
        total: 0,
      };
      aanmeldingen.push(report);
      return report;
    }

    rawResults.forEach((row) => {
      const reportItem =
        aanmeldingen.find((report) => report.key === row.key1) ??
        newReport(row.key1);
      if ('key2' in row) {
        const rows = reportItem.rows ?? [];
        rows.push({ count: row.total, key: row.key2 ?? '' });
        reportItem.rows = rows;
      }
      reportItem.total += row.total;
    });
    return aanmeldingen;
  }
}

function reportTypeJoin(reportType: AanmeldingReportType): string {
  switch (reportType) {
    case 'deelnames':
      return 'INNER JOIN deelname ON deelname."aanmeldingId" = aanmelding.id AND deelname."effectieveDeelnamePerunage" > 0';
    case 'aanmeldingen':
      return '';
    case 'deelnemersuren':
      return `
      INNER JOIN deelname ON deelname."aanmeldingId" = aanmelding.id AND deelname."effectieveDeelnamePerunage" > 0
      INNER JOIN activiteit ON activiteit.id = deelname."activiteitId"
      `;
  }
}

function filterWhere(filter: AanmeldingReportFilter): string {
  const whereClauses: string[] = [];
  if (filter.enkelEersteAanmeldingen) {
    switch (filter.type) {
      case 'cursus':
        whereClauses.push('aanmelding.id = persoon."eersteCursusAanmeldingId"');
        break;
      case 'vakantie':
        whereClauses.push(
          'aanmelding.id = persoon."eersteVakantieAanmeldingId"',
        );
        break;
      default:
        whereClauses.push(
          'aanmelding.id IN (persoon."eersteVakantieAanmeldingId", persoon."eersteCursusAanmeldingId")',
        );
        break;
    }
  }
  if (filter.organisatieonderdeel) {
    whereClauses.push(
      `project."organisatieonderdeel" = '${filter.organisatieonderdeel}'`,
    );
  }
  if (filter.type) {
    whereClauses.push(`project.type = '${filter.type}'`);
  }
  if (filter.jaar) {
    whereClauses.push(`project.jaar = ${filter.jaar}`);
  }
  if (filter.aanmeldingsstatus) {
    whereClauses.push(`aanmelding.status = '${filter.aanmeldingsstatus}'`);
  }
  if (filter.overnachting !== undefined) {
    whereClauses.push(
      `project.id IN (SELECT "projectId" FROM activiteit WHERE activiteit."metOvernachting" = ${
        filter.overnachting === 'met' ? 'true' : 'false'
      })`,
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
      return 'COUNT(aanmelding.id)';
    case 'deelnemersuren':
      return 'SUM(deelname."effectieveDeelnamePerunage" * activiteit.vormingsuren)';
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
      return 'project.jaar';
    case 'provincie':
      return 'plaats."provincieId"';
    case 'woonsituatie':
      return 'aanmelding.woonsituatie';
    case 'werksituatie':
      return 'aanmelding.werksituatie';
    case 'geslacht':
      return 'aanmelding.geslacht';
    case 'organisatieonderdeel':
      return 'project.organisatieonderdeel';
    case 'project':
      return 'project.id';
  }
}

function select(field: AanmeldingGroupField): string {
  switch (field) {
    case 'jaar':
      return 'jaar';
    case 'provincie':
      return '"provincieId"';
    case 'woonsituatie':
      return 'aanmelding.woonsituatie';
    case 'werksituatie':
      return 'aanmelding.werksituatie';
    case 'geslacht':
      return 'aanmelding.geslacht';
    case 'organisatieonderdeel':
      return 'organisatieonderdeel';
    case 'project':
      return "CONCAT(project.projectnummer, ' ', project.naam)";
  }
}
