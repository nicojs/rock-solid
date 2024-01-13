import {
  type Organisatie,
  type OrganisatieFilter,
  TOTAL_COUNT_HEADER,
  type UpsertableOrganisatie,
  PAGE_QUERY_STRING_NAME,
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
import type { Response } from 'express';
import { PagePipe } from './pipes/page.pipe.js';
import { OrganisatieMapper } from './services/organisatie.mapper.js';
import { Privileges } from './auth/privileges.guard.js';
import { NumberPipe } from './pipes/number.pipe.js';
import { OrganisatieFilterPipe } from './pipes/filter.pipe.js';

@Controller({ path: 'organisaties' })
export class OrganisatiesController {
  constructor(private organisatieMapper: OrganisatieMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(OrganisatieFilterPipe) filter: OrganisatieFilter,
    @Query(PAGE_QUERY_STRING_NAME, PagePipe) page?: number,
  ): Promise<Organisatie[]> {
    const [people, count] = await Promise.all([
      this.organisatieMapper.getAll(filter, page),
      this.organisatieMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());
    return people;
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Organisatie> {
    const persoon = await this.organisatieMapper.getOne({ id: +id });
    if (persoon) {
      return persoon;
    } else {
      throw new NotFoundException();
    }
  }

  @Post()
  @Privileges('write:organisaties')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() org: UpsertableOrganisatie) {
    return this.organisatieMapper.create(org);
  }

  @Put(':id')
  @Privileges('write:organisaties')
  async update(
    @Param('id') id: string,
    @Body() org: Organisatie,
  ): Promise<Organisatie> {
    return this.organisatieMapper.update({
      where: { id: +id },
      data: org,
    });
  }

  @Delete(':id')
  @Privileges('write:organisaties')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', NumberPipe) id: number): Promise<void> {
    await this.organisatieMapper.delete(id);
  }
}
