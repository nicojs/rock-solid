import { Injectable } from '@nestjs/common';
import {
  GroupedReport,
  GroupField,
  ProjectReport,
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
  ): Promise<ProjectReport> {
    const rawResults = await this.db.$queryRawUnsafe<
      { key1: string; key2?: string; count: number }[]
    >(`
    SELECT 
      ${select(groupField)}::text as key1, 
      ${secondGroupField ? `${select(secondGroupField)}::text as key2,` : ''} 
      COUNT(inschrijving.id)::int as count
    FROM inschrijving
    INNER JOIN project ON inschrijving."projectId" = project.id ${
      projectType ? `AND project.type = '${projectType}'::project_type` : ''
    }
    ${reportTypeJoin(reportType)}
    INNER JOIN persoon ON persoon.id = inschrijving."deelnemerId"    
    INNER JOIN plaats ON inschrijving."woonplaatsDeelnemerId" = plaats.id
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `);
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
        rows.push({ count: row.count, key: row.key2 ?? '' });
        reportItem.rows = rows;
      }
      reportItem.total += row.count;
    });

    return inschrijvingen;

    function reportTypeJoin(reportType: ProjectReportType): string {
      switch (reportType) {
        case 'deelnames':
          return 'INNER JOIN deelname ON deelname."inschrijvingId" = inschrijving.id AND deelname."effectieveDeelnamePerunage" > 0';
        case 'inschrijvingen':
          return '';
      }
    }
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
  }
}
