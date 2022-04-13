import {
  Organisatie,
  OrganisatieFilter,
  TOTAL_COUNT_HEADER,
  UpsertableOrganisatie,
} from '@kei-crm/shared';
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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from './auth/index.js';
import { OrganisatieFilterPipe } from './pipes/organisatie-filter.pipe.js';
import { PagePipe } from './pipes/page.pipe.js';
import { OrganisatieMapper } from './services/organisatie.mapper.js';

@Controller({ path: 'organisaties' })
@UseGuards(JwtAuthGuard)
export class OrganisatiesController {
  constructor(private organisatieMapper: OrganisatieMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(OrganisatieFilterPipe) filter: OrganisatieFilter,
    @Query('_page', PagePipe) page?: number,
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
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() org: UpsertableOrganisatie) {
    return this.organisatieMapper.create(org);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() org: UpsertableOrganisatie,
  ): Promise<void> {
    await this.organisatieMapper.update({
      where: { id: +id },
      data: org,
    });
  }
}
