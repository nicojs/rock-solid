import { Controller, Get, Param, Query } from '@nestjs/common';
import type {
  AanmeldingGroupField,
  Report,
  AanmeldingReportFilter,
  AanmeldingReportType,
  ActiviteitGroupField,
  ActiviteitReportFilter,
  ActiviteitReportType,
} from '@rock-solid/shared';
import {
  AanmeldingGroupingFieldPipe,
  AanmeldingReportFilterPipe,
  AanmeldingReportTypePipe,
  ActiviteitGroupingFieldPipe,
  ActiviteitReportFilterPipe,
  ActiviteitReportTypePipe,
} from './pipes/report-pipes.pipe.js';
import { RequiredPipe } from './pipes/required.pipe.js';
import { ReportMapper } from './services/report.mapper.js';

@Controller({ path: 'reports' })
export class ReportsController {
  constructor(private readonly reportMapper: ReportMapper) {}

  @Get('aanmeldingen/:aanmeldingReport')
  async aanmeldingen(
    @Param('aanmeldingReport', AanmeldingReportTypePipe, RequiredPipe)
    report: AanmeldingReportType,
    @Query('by', AanmeldingGroupingFieldPipe, RequiredPipe)
    group1: AanmeldingGroupField,
    @Query('andBy', AanmeldingGroupingFieldPipe)
    group2: AanmeldingGroupField | undefined,
    @Query(AanmeldingReportFilterPipe)
    filter: AanmeldingReportFilter,
  ): Promise<Report> {
    return this.reportMapper.aanmeldingen(report, group1, group2, filter);
  }

  @Get('activiteiten/:activiteitReport')
  async activiteiten(
    @Param('activiteitReport', ActiviteitReportTypePipe, RequiredPipe)
    report: ActiviteitReportType,
    @Query('by', ActiviteitGroupingFieldPipe, RequiredPipe)
    group1: ActiviteitGroupField,
    @Query('andBy', ActiviteitGroupingFieldPipe)
    group2: ActiviteitGroupField | undefined,
    @Query(ActiviteitReportFilterPipe)
    filter: ActiviteitReportFilter,
  ): Promise<Report> {
    return this.reportMapper.activiteiten(report, group1, group2, filter);
  }
}
