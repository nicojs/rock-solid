import { Injectable } from '@nestjs/common';
import {
  GroupedReport,
  GroupField,
  InschrijvingenReport,
  ProjectType,
} from '@rock-solid/shared';
import { DBService } from './db.service.js';

@Injectable()
export class ReportMapper {
  constructor(private db: DBService) {}

  async aantalInschrijvingen(
    type: ProjectType | undefined,
    groupField: GroupField,
    secondGroupField: GroupField | undefined,
  ): Promise<InschrijvingenReport> {
    const rawResults = await this.db.$queryRawUnsafe<
      { key1: string; key2?: string; count: number }[]
    >(`
    SELECT 
      ${select(groupField)}::text as key1, 
      ${secondGroupField ? `${select(secondGroupField)}::text as key2,` : ''} 
      COUNT(inschrijving.id)::int as count
    FROM inschrijving
    INNER JOIN project ON inschrijving."projectId" = project.id ${
      type ? `AND project.type = '${type}'::project_type` : ''
    }
    INNER JOIN persoon ON persoon.id = inschrijving."deelnemerId"    
    INNER JOIN plaats ON inschrijving."woonplaatsDeelnemerId" = plaats.id
    GROUP BY ${fieldName(groupField)}${
      secondGroupField ? `, ${fieldName(secondGroupField)}` : ''
    }
    ORDER BY ${fieldName(groupField)} DESC${
      secondGroupField ? `, ${fieldName(secondGroupField)} DESC` : ''
    }
    `);
    const inschrijvingen: InschrijvingenReport = [];
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
      if (row.key2) {
        const rows = reportItem.rows ?? [];
        rows.push({ count: row.count, key: row.key2 });
        reportItem.rows = rows;
      }
      reportItem.total += row.count;
    });

    return inschrijvingen;
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
