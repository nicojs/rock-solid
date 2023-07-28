import {
  type Deelname,
  type Aanmelding,
  type Project,
  type ProjectFilter,
  TOTAL_COUNT_HEADER,
  type UpsertableDeelname,
  type UpsertableAanmelding,
  type UpsertableProject,
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
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DeelnameMapper } from './services/deelname.mapper.js';
import { AanmeldingMapper } from './services/aanmelding.mapper.js';
import { ProjectMapper } from './services/project.mapper.js';
import { PagePipe } from './pipes/page.pipe.js';
import { MetaFilterPipe } from './pipes/pipe-utils.js';
import { Privileges } from './auth/privileges.guard.js';

@Controller({ path: 'projecten' })
export class ProjectenController {
  constructor(
    private readonly projectMapper: ProjectMapper,
    private readonly aanmeldingMapper: AanmeldingMapper,
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

  @Get(':id/aanmeldingen')
  getAanmeldingen(
    @Param('id', ParseIntPipe) projectId: number,
  ): Promise<Aanmelding[]> {
    return this.aanmeldingMapper.getAll({ projectId });
  }

  @Get(':projectId/activiteiten/:activiteitId/deelnames')
  getDeelnames(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('activiteitId', ParseIntPipe) activiteitId: number,
  ): Promise<Deelname[]> {
    return this.deelnameMapper.getAll({ projectId, activiteitId });
  }

  @Put(':projectId/activiteiten/:activiteitId/deelnames')
  @Privileges('write:deelnames')
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
  @Privileges('write:projecten')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() project: UpsertableProject) {
    return this.projectMapper.createProject(project);
  }

  @Put(':id')
  @Privileges('write:projecten')
  async update(
    @Param('id') id: string,
    @Body() project: UpsertableProject,
  ): Promise<Project> {
    return this.projectMapper.updateProject(+id, project);
  }

  @Post(':id/aanmeldingen')
  @Privileges('write:aanmeldingen')
  @HttpCode(HttpStatus.CREATED)
  async createAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() aanmelding: UpsertableAanmelding,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.create(aanmelding);
  }

  @Put(':id/aanmeldingen/:aanmeldingId')
  @Privileges('write:aanmeldingen')
  async updateAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('aanmeldingId', ParseIntPipe) aanmeldingId: number,
    @Body() aanmelding: UpsertableAanmelding,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.update(aanmeldingId, aanmelding);
  }

  @Patch(':id/aanmeldingen/:aanmeldingId')
  @Privileges('write:aanmeldingen')
  async partialUpdateAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('aanmeldingId', ParseIntPipe) aanmeldingId: number,
    @Body() aanmelding: Partial<Aanmelding>,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.update(aanmeldingId, aanmelding);
  }
}
