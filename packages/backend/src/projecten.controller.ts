import {
  Deelname,
  Inschrijving,
  Project,
  ProjectFilter,
  UpsertableDeelname,
  UpsertableInschrijving,
  UpsertableProject,
} from '@kei-crm/shared';
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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './auth';
import { DeelnameMapper } from './services/deelname.mapper';
import { InschrijvingMapper } from './services/inschrijving.mapper';
import { ProjectMapper } from './services/project.mapper';

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
  getAll(@Query() filter: ProjectFilter): Promise<Project[]> {
    return this.projectMapper.getAll(filter);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() project: UpsertableProject,
  ): Promise<void> {
    await this.projectMapper.updateProject(+id, project);
  }

  @Put(':id/inschrijvingen/:inschrijvingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateInschrijving(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('inschrijvingId', ParseIntPipe) inschrijvingId: number,
    @Body() inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    inschrijving.projectId = projectId;
    return this.inschrijvingenMapper.update(inschrijvingId, inschrijving);
  }
}
