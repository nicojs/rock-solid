import {
  Deelname,
  Inschrijving,
  Project,
  ProjectFilter,
  TOTAL_COUNT_HEADER,
  UpsertableDeelname,
  UpsertableInschrijving,
  UpsertableProject,
} from '@rock-solid/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from './auth/index.js';
import { DeelnameMapper } from './services/deelname.mapper.js';
import { InschrijvingMapper } from './services/inschrijving.mapper.js';
import { ProjectMapper } from './services/project.mapper.js';
import { PagePipe } from './pipes/page.pipe.js';
import { MetaFilterPipe } from './pipes/pipe-utils.js';

@Controller({ path: 'projecten' })
@UseGuards(JwtAuthGuard)
export class ProjectenController {
  constructor(
    private readonly projectMapper: ProjectMapper,
    private readonly inschrijvingenMapper: InschrijvingMapper,
    private readonly deelnameMapper: DeelnameMapper,
  ) {}

  @Get(':id')
  async get(@Param('id') id: string): Promise<Project> {
    const persoon = await this.projectMapper.getOne({ id: +id });
    if (persoon) {
      return persoon;
    } else {
      throw new NotFoundException();
    }
  }

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(MetaFilterPipe) filter: ProjectFilter,
    @Query('_page', PagePipe)
    page?: number,
  ): Promise<Project[]> {
    const [projects, count] = await Promise.all([
      this.projectMapper.getAll(filter, page),
      this.projectMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());
    return projects;
  }

  @Get(':id/inschrijvingen')
  getInschrijvingen(
    @Param('id', ParseIntPipe) projectId: number,
  ): Promise<Inschrijving[]> {
    return this.inschrijvingenMapper.getAll({ projectId });
  }

  @Get(':projectId/activiteiten/:activiteitId/deelnames')
  getDeelnames(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('activiteitId', ParseIntPipe) activiteitId: number,
  ): Promise<Deelname[]> {
    return this.deelnameMapper.getAll({ projectId, activiteitId });
  }

  @Put(':projectId/activiteiten/:activiteitId/deelnames')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateDeelnames(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('activiteitId', ParseIntPipe) activiteitId: number,
    @Body() deelnames: UpsertableDeelname[],
  ): Promise<void> {
    return this.deelnameMapper.updateAll({
      projectId,
      activiteitId,
      deelnames,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() project: UpsertableProject) {
    return this.projectMapper.createProject(project);
  }

  @Post(':id/inschrijvingen')
  @HttpCode(HttpStatus.CREATED)
  async createInschrijving(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    inschrijving.projectId = projectId;
    return this.inschrijvingenMapper.create(inschrijving);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() project: UpsertableProject,
  ): Promise<Project> {
    return this.projectMapper.updateProject(+id, project);
  }

  @Put(':id/inschrijvingen/:inschrijvingId')
  async updateInschrijving(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('inschrijvingId', ParseIntPipe) inschrijvingId: number,
    @Body() inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    inschrijving.projectId = projectId;
    return this.inschrijvingenMapper.update(inschrijvingId, inschrijving);
  }
}
