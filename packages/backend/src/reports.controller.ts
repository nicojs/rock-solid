import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  GroupField,
  InschrijvingenReport,
  ProjectType,
} from '@rock-solid/shared';
import { JwtAuthGuard } from './auth/index.js';
import { GroupingFieldPipe } from './pipes/grouping-field.pipe.js';
import { ProjectTypePipe } from './pipes/project-type.pipe.js';
import { RequiredPipe } from './pipes/required.pipe.js';
import { ReportMapper } from './services/report.mapper.js';

@Controller({ path: 'reports' })
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportMapper: ReportMapper) {}

  @Get('projecten/inschrijvingen')
  async inschrijvingen(
    @Query('type', ProjectTypePipe) type: ProjectType | undefined,
    @Query('by', GroupingFieldPipe, RequiredPipe) group1: GroupField,
    @Query('andBy', GroupingFieldPipe) group2: GroupField | undefined,
  ): Promise<InschrijvingenReport> {
    return this.reportMapper.aantalInschrijvingen(type, group1, group2);
  }
}
