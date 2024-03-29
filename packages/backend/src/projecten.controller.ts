import {
  type Aanmelding,
  type Project,
  type ProjectFilter,
  TOTAL_COUNT_HEADER,
  type UpsertableDeelname,
  type InsertableAanmelding,
  type UpsertableProject,
  type UpdatableAanmelding,
  type PatchableAanmelding,
} from '@rock-solid/shared';
import {
  Body,
  Controller,
  Delete,
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
import { AanmeldingMapper } from './services/aanmelding.mapper.js';
import { ProjectMapper } from './services/project.mapper.js';
import { PagePipe } from './pipes/page.pipe.js';
import { Privileges } from './auth/privileges.guard.js';
import { ProjectFilterPipe } from './pipes/project-filter.pipe.js';

@Controller({ path: 'projecten' })
export class ProjectenController {
  constructor(
    private readonly projectMapper: ProjectMapper,
    private readonly aanmeldingMapper: AanmeldingMapper,
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
    @Query(ProjectFilterPipe) filter: ProjectFilter,
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

  @Put(':projectId/activiteiten/:activiteitId/deelnames')
  @Privileges('write:deelnames')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateDeelnames(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('activiteitId', ParseIntPipe) activiteitId: number,
    @Body() deelnames: UpsertableDeelname[],
  ): Promise<void> {
    return this.aanmeldingMapper.updateActiviteitDeelnames({
      projectId,
      activiteitId,
      deelnames,
    });
  }

  @Post()
  @Privileges('create:projecten')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() project: UpsertableProject) {
    return this.projectMapper.createProject(project);
  }

  @Put(':id')
  @Privileges('update:projecten')
  async update(
    @Param('id') id: string,
    @Body() project: UpsertableProject,
  ): Promise<Project> {
    return this.projectMapper.updateProject(+id, project);
  }

  @Post(':id/aanmeldingen')
  @Privileges('create:aanmeldingen')
  @HttpCode(HttpStatus.CREATED)
  async createAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() aanmelding: InsertableAanmelding,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.create(aanmelding);
  }

  @Patch(':id/aanmeldingen')
  @Privileges('update:aanmeldingen')
  async partialUpdateAanmeldingen(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() aanmeldingen: PatchableAanmelding[],
  ): Promise<Aanmelding[]> {
    aanmeldingen.forEach((aanmelding) => (aanmelding.projectId = projectId));
    return this.aanmeldingMapper.patchAll(aanmeldingen);
  }

  @Put(':id/aanmeldingen/:aanmeldingId')
  @Privileges('update:aanmeldingen')
  async updateAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('aanmeldingId', ParseIntPipe) aanmeldingId: number,
    @Body() aanmelding: UpdatableAanmelding,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.update(aanmeldingId, aanmelding);
  }

  @Patch(':id/aanmeldingen/:aanmeldingId')
  @Privileges('update:aanmeldingen')
  async partialUpdateAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('aanmeldingId', ParseIntPipe) aanmeldingId: number,
    @Body() aanmelding: PatchableAanmelding,
  ): Promise<Aanmelding> {
    aanmelding.projectId = projectId;
    return this.aanmeldingMapper.patch(aanmeldingId, aanmelding);
  }

  @Delete(':id/aanmeldingen/:aanmeldingId')
  @Privileges('delete:aanmeldingen')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAanmelding(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('aanmeldingId', ParseIntPipe) aanmeldingId: number,
  ): Promise<void> {
    await this.aanmeldingMapper.delete(projectId, aanmeldingId);
  }

  @Delete(':id')
  @Privileges('delete:projecten')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.projectMapper.delete(id);
  }
}
