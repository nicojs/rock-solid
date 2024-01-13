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
import {
  type LocatieFilter,
  toLocatieFilter,
  Locatie,
  type UpsertableLocatie,
  TOTAL_COUNT_HEADER,
  PAGE_QUERY_STRING_NAME,
} from '@rock-solid/shared';
import { LocatieMapper } from './services/locatie.mapper.js';
import { Privileges } from './auth/privileges.guard.js';
import { NumberPipe } from './pipes/number.pipe.js';
import { PagePipe } from './pipes/page.pipe.js';
import type { Response } from 'express';

@Controller({ path: 'locaties' })
export class LocatiesController {
  constructor(private locatieMapper: LocatieMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query({ transform: toLocatieFilter })
    filter: LocatieFilter,
    @Query(PAGE_QUERY_STRING_NAME, PagePipe) page?: number,
  ): Promise<Locatie[]> {
    const [locaties, count] = await Promise.all([
      this.locatieMapper.getAll(filter, page),
      this.locatieMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());

    return locaties;
  }

  @Get(':id')
  async get(@Param('id', NumberPipe) id: number): Promise<Locatie> {
    const locatie = await this.locatieMapper.get(id);
    if (locatie) {
      return locatie;
    } else {
      throw new NotFoundException();
    }
  }

  @Post()
  @Privileges('write:locaties')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() locatie: UpsertableLocatie) {
    return this.locatieMapper.create(locatie);
  }

  @Put(':id')
  @Privileges('write:locaties')
  async update(
    @Param('id', NumberPipe) id: number,
    @Body() locatie: UpsertableLocatie,
  ) {
    return this.locatieMapper.update(id, locatie);
  }

  @Delete(':id')
  @Privileges('write:locaties')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', NumberPipe) id: number): Promise<void> {
    return this.locatieMapper.delete(id);
  }
}
