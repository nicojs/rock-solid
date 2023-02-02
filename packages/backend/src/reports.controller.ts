import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  GroupField,
  ProjectReport,
  ProjectReportFilter,
  AanmeldingenReportType,
  ProjectType,
} from '@rock-solid/shared';
import { JwtAuthGuard } from './auth/index.js';
import { GroupingFieldPipe } from './pipes/grouping-field.pipe.js';
import { ProjectReportFilterPipe } from './pipes/project-report-filter.pipe.js';
import { ProjectReportTypePipe } from './pipes/project-report-type.pipe.js';
import { ProjectTypePipe } from './pipes/project-type.pipe.js';
import { RequiredPipe } from './pipes/required.pipe.js';
import { ReportMapper } from './services/report.mapper.js';

@Controller({ path: 'reports' })
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportMapper: ReportMapper) {}

  @Get('aanmelding/:projectReport')
  async aanmelding(
    @Param('projectReport', ProjectReportTypePipe, RequiredPipe)
    report: AanmeldingenReportType,
    @Query('type', ProjectTypePipe)
    type: ProjectType | undefined,
    @Query('by', GroupingFieldPipe, RequiredPipe) group1: GroupField,
    @Query('andBy', GroupingFieldPipe) group2: GroupField | undefined,
    @Query(ProjectReportFilterPipe)
    filter: ProjectReportFilter,
  ): Promise<ProjectReport> {
    return this.reportMapper.aanmeldingen(report, type, group1, group2, filter);
  }
}
