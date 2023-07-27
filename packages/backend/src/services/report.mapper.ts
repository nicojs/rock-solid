import { Injectable } from '@nestjs/common';
import {
  GroupedReport,
  GroupField,
  ProjectReport,
  ProjectReportFilter,
  ProjectenReportType,
  ProjectType,
} from '@rock-solid/shared';
import { DBService } from './db.service.js';

@Injectable()
export class ReportMapper {
  constructor(private db: DBService) {}

  async projecten(
    reportType: ProjectenReportType,
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
    FROM aanmelding
    INNER JOIN project ON aanmelding."projectId" = project.id ${
      projectType ? `AND project.type = '${projectType}'::project_type` : ''
    }
    ${reportTypeJoin(reportType)}
    INNER JOIN persoon ON persoon.id = aanmelding."deelnemerId"    
    INNER JOIN plaats ON aanmelding."woonplaatsDeelnemerId" = plaats.id
    ${filterWhere(projectType, filter)}
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `;
    // console.log(query);
    const rawResults = await this.db.$queryRawUnsafe<
      { key1: string; key2?: string; total: number }[]
    >(query);
    const aanmeldingen: ProjectReport = [];
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

function reportTypeJoin(reportType: ProjectenReportType): string {
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

function filterWhere(
  projectType: ProjectType | undefined,
  filter: ProjectReportFilter,
): string {
  const whereClauses: string[] = [];
  if (filter.enkelEersteAanmeldingen) {
    switch (projectType) {
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
function reportTypeAggregator(reportType: ProjectenReportType): string {
  switch (reportType) {
    case 'deelnames':
    case 'aanmeldingen':
      return 'COUNT(aanmelding.id)';
    case 'deelnemersuren':
      return 'SUM(deelname."effectieveDeelnamePerunage" * activiteit.vormingsuren)';
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
