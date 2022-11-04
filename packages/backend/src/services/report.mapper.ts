import { Injectable } from '@nestjs/common';
import {
  GroupedReport,
  GroupField,
  ProjectReport,
  ProjectReportFilter,
  ProjectReportType,
  ProjectType,
} from '@rock-solid/shared';
import { DBService } from './db.service.js';

@Injectable()
export class ReportMapper {
  constructor(private db: DBService) {}

  async project(
    reportType: ProjectReportType,
    projectType: ProjectType | undefined,
    groupField: GroupField,
    secondGroupField: GroupField | undefined,
    filter: ProjectReportFilter,
  ): Promise<ProjectReport> {
    const query = `
    SELECT 
      ${select(groupField)}::text as key1, 
      ${secondGroupField ? `${select(secondGroupField)}::text as key2,` : ''} 
      ${reportTypeAggregator(reportType)}::int as total
    FROM inschrijving
    INNER JOIN project ON inschrijving."projectId" = project.id ${
      projectType ? `AND project.type = '${projectType}'::project_type` : ''
    }
    ${reportTypeJoin(reportType)}
    INNER JOIN persoon ON persoon.id = inschrijving."deelnemerId"    
    INNER JOIN plaats ON inschrijving."woonplaatsDeelnemerId" = plaats.id
    ${filterWhere(filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `;
    console.log(query);
    const rawResults = await this.db.$queryRawUnsafe<
      { key1: string; key2?: string; total: number }[]
    >(query);
    const inschrijvingen: ProjectReport = [];
    function newReport(key: string) {
      const report: GroupedReport = {
        key,
        total: 0,
      };
      inschrijvingen.push(report);
      return report;
    }

    rawResults.forEach((row) => {
      const reportItem =
        inschrijvingen.find((report) => report.key === row.key1) ??
        newReport(row.key1);
      if ('key2' in row) {
        const rows = reportItem.rows ?? [];
        rows.push({ count: row.total, key: row.key2 ?? '' });
        reportItem.rows = rows;
      }
      reportItem.total += row.total;
    });

    return inschrijvingen;
  }
}

function reportTypeJoin(reportType: ProjectReportType): string {
  switch (reportType) {
    case 'deelnames':
      return 'INNER JOIN deelname ON deelname."inschrijvingId" = inschrijving.id AND deelname."effectieveDeelnamePerunage" > 0';
    case 'inschrijvingen':
      return '';
    case 'deelnemersuren':
      return `
      INNER JOIN deelname ON deelname."inschrijvingId" = inschrijving.id AND deelname."effectieveDeelnamePerunage" > 0
      INNER JOIN activiteit ON activiteit.id = deelname."activiteitId"
      `;
    case 'vormingsuren':
      return `INNER JOIN activiteit ON activiteit."projectId" = project.id`;
  }
}

function filterWhere(filter: ProjectReportFilter): string {
  const whereClauses: string[] = [];
  if (filter.enkelEersteInschrijvingen) {
    whereClauses.push('inschrijving."eersteInschrijving" = true');
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
  if (whereClauses.length) {
    return `WHERE ${whereClauses.join(' AND ')}`;
  }
  return '';
}
function reportTypeAggregator(reportType: ProjectReportType): string {
  switch (reportType) {
    case 'deelnames':
    case 'inschrijvingen':
      return 'COUNT(inschrijving.id)';
    case 'deelnemersuren':
      return 'SUM(deelname."effectieveDeelnamePerunage" * activiteit.vormingsuren)';
    case 'vormingsuren':
      return 'SUM(activiteit.vormingsuren)';
  }
}

function fieldName(field: GroupField): string {
  switch (field) {
    case 'jaar':
      return 'project.jaar';
    case 'provincie':
      return 'plaats."provincieId"';
    case 'woonsituatie':
      return 'persoon.woonsituatie';
    case 'werksituatie':
      return 'persoon.werksituatie';
    case 'geslacht':
      return 'persoon.geslacht';
    case 'organisatieonderdeel':
      return 'project.organisatieonderdeel';
    case 'project':
      return 'project.id';
  }
}

function select(field: GroupField): string {
  switch (field) {
    case 'jaar':
      return 'jaar';
    case 'provincie':
      return '"provincieId"';
    case 'woonsituatie':
      return 'woonsituatie';
    case 'werksituatie':
      return 'werksituatie';
    case 'geslacht':
      return 'geslacht';
    case 'organisatieonderdeel':
      return 'organisatieonderdeel';
    case 'project':
      return "CONCAT(project.projectnummer, ' ', project.naam)";
  }
}
