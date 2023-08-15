import { Controller, Get, Param, Query } from '@nestjs/common';
import type {
  AanmeldingGroupField,
  Report,
  AanmeldingReportFilter,
  AanmeldingReportType,
  ProjectType,
} from '@rock-solid/shared';
import { AanmeldingGroupingFieldPipe } from './pipes/aanmelding-grouping-field.pipe.js';
import { AanmeldingReportFilterPipe } from './pipes/aanmelding-report-filter.pipe.js';
import { AanmeldingReportTypePipe } from './pipes/aanmelding-report-type.pipe.js';
import { ProjectTypePipe } from './pipes/project-type.pipe.js';
import { RequiredPipe } from './pipes/required.pipe.js';
import { ReportMapper } from './services/report.mapper.js';

@Controller({ path: 'reports' })
export class ReportsController {
  constructor(private readonly reportMapper: ReportMapper) {}

  @Get('aanmeldingen/:projectReport')
  async aanmeldingen(
    @Param('projectReport', AanmeldingReportTypePipe, RequiredPipe)
    report: AanmeldingReportType,
    @Query('type', ProjectTypePipe)
    type: ProjectType | undefined,
    @Query('by', AanmeldingGroupingFieldPipe, RequiredPipe)
    group1: AanmeldingGroupField,
    @Query('andBy', AanmeldingGroupingFieldPipe)
    group2: AanmeldingGroupField | undefined,
    @Query(AanmeldingReportFilterPipe)
    filter: AanmeldingReportFilter,
  ): Promise<Report> {
    return this.reportMapper.aanmeldingen(report, type, group1, group2, filter);
  }
}
