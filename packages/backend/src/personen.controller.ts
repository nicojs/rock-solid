import {
  type Persoon,
  type PersoonFilter,
  type UpsertablePersoon,
  TOTAL_COUNT_HEADER,
  type Project,
  type ProjectFilter,
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
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { PagePipe } from './pipes/page.pipe.js';
import { PersoonFilterPipe } from './pipes/persoon-filter.pipe.js';
import { PersoonMapper } from './services/persoon.mapper.js';
import type { Response } from 'express';
import { MetaFilterPipe } from './pipes/pipe-utils.js';
import { ProjectMapper } from './services/project.mapper.js';
import { NumberPipe } from './pipes/number.pipe.js';
import { Privileges } from './auth/privileges.guard.js';

@Controller({ path: 'personen' })
export class PersonenController {
  constructor(
    private readonly persoonMapper: PersoonMapper,
    private readonly projectMapper: ProjectMapper,
  ) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(PersoonFilterPipe) filter: PersoonFilter,
    @Query('_page', PagePipe)
    page?: number,
  ): Promise<Persoon[]> {
    const [people, count] = await Promise.all([
      this.persoonMapper.getAll(filter, page),
      this.persoonMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());
    return people;
  }

  @Get(':id')
  async get(@Param('id', NumberPipe) id: number): Promise<Persoon> {
    const persoon = await this.persoonMapper.getOne({ id });
    if (persoon) {
      return persoon;
    } else {
      throw new NotFoundException();
    }
  }

  @Get(`:id/aanmeldingen`)
  async getProjectAanmeldingen(
    @Param('id', NumberPipe) id: number,
    @Query(MetaFilterPipe) filter: ProjectFilter,
  ): Promise<Project[]> {
    const projecten = await this.projectMapper.getAll(
      { ...filter, aanmeldingPersoonId: id },
      undefined,
    );
    return projecten;
  }

  @Get(`:id/begeleid`)
  async getBegeleideProjecten(
    @Param('id', NumberPipe) id: number,
    @Query(MetaFilterPipe) filter: ProjectFilter,
  ): Promise<Project[]> {
    const projecten = await this.projectMapper.getAll(
      { ...filter, begeleidDoorPersoonId: id },
      undefined,
    );
    return projecten;
  }

  @Delete(`:id`)
  @Privileges('write:personen')
  async delete(
    @Param('id', NumberPipe) id: number,
    @Res({ passthrough: true }) resp: Response,
  ): Promise<void> {
    await this.persoonMapper.delete(id);
    resp.status(HttpStatus.NO_CONTENT);
  }

  @Post()
  @Privileges('write:personen')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() persoon: UpsertablePersoon) {
    return this.persoonMapper.createPersoon(persoon);
  }

  @Put(':id')
  @Privileges('write:personen')
  async update(
    @Param('id') id: string,
    @Body() persoon: Persoon,
  ): Promise<Persoon> {
    return this.persoonMapper.updatePersoon({
      where: { id: +id },
      persoon: persoon,
    });
  }
}
