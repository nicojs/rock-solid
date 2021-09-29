import { Project } from '@prisma/client';
import { Controller, Get } from '@nestjs/common';
import { ProjectMapper } from './services/project.mapper';

@Controller({ path: 'projecten' })
export class ProjectenController {
  constructor(private readonly projectMapper: ProjectMapper) {}

  @Get()
  getAll(): Promise<Project[]> {
    return this.projectMapper.getAll();
  }
}
