import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  GroupField,
  InschrijvingenReport,
  ProjectType,
} from '@rock-solid/shared';
import { JwtAuthGuard } from './auth/index.js';
import { GroupingFieldPipe } from './pipes/grouping-field.pipe.js';
import { ProjectTypePipe } from './pipes/project-type.pipe.js';
import { ReportMapper } from './services/report.mapper.js';

@Controller({ path: 'reports' })
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportMapper: ReportMapper) {}

  @Get('projecten/:type/inschrijvingen')
  async inschrijvingen(
    @Param('type', ProjectTypePipe) type: ProjectType,
    @Query('by', GroupingFieldPipe) group1: GroupField,
    @Query('andBy', GroupingFieldPipe) group2: GroupField,
  ): Promise<InschrijvingenReport> {
    return this.reportMapper.aantalInschrijvingen(type, group1, group2);
  }
}
