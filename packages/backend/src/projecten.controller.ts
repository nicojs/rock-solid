import {
  Inschrijving,
  Project,
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
} from '@nestjs/common';
import { InschrijvingMapper } from './services/inschrijving.mapper';
import { ProjectMapper } from './services/project.mapper';

@Controller({ path: 'projecten' })
export class ProjectenController {
  constructor(
    private readonly projectMapper: ProjectMapper,
    private readonly inschrijvingenMapper: InschrijvingMapper,
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
  getAll(): Promise<Project[]> {
    return this.projectMapper.getAll();
  }

  @Get(':id/inschrijvingen')
  getInschrijvingen(
    @Param('id', ParseIntPipe) projectId: number,
  ): Promise<Inschrijving[]> {
    return this.inschrijvingenMapper.getAll({ projectId });
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

  // @Get(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async update(
  //   @Param('id') id: string,
  //   @Body() project: UpsertableProject,
  // ): Promise<void> {
  //   await this.projectMapper.updateProject(+id, project);
  // }
}
