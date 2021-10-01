import { Project, UpsertableProject } from '@kei-crm/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProjectMapper } from './services/project.mapper';

@Controller({ path: 'projecten' })
export class ProjectenController {
  constructor(private readonly projectMapper: ProjectMapper) {}

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() project: UpsertableProject) {
    return this.projectMapper.createProject(project);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() project: UpsertableProject,
  ): Promise<void> {
    await this.projectMapper.updateProject(+id, project);
  }
}
