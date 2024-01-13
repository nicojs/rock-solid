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
  type CursusLocatieFilter,
  toCursusLocatieFilter,
  CursusLocatie,
  type UpsertableCursusLocatie,
  TOTAL_COUNT_HEADER,
  PAGE_QUERY_STRING_NAME,
} from '@rock-solid/shared';
import { CursuslocatieMapper } from './services/cursuslocatie.mapper.js';
import { Privileges } from './auth/privileges.guard.js';
import { NumberPipe } from './pipes/number.pipe.js';
import { PagePipe } from './pipes/page.pipe.js';
import type { Response } from 'express';

@Controller({ path: 'cursuslocaties' })
export class CursusLocatiesController {
  constructor(private cursusLocatieMapper: CursuslocatieMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query({ transform: toCursusLocatieFilter })
    filter: CursusLocatieFilter,
    @Query(PAGE_QUERY_STRING_NAME, PagePipe) page?: number,
  ): Promise<CursusLocatie[]> {
    const [locaties, count] = await Promise.all([
      this.cursusLocatieMapper.getAll(filter, page),
      this.cursusLocatieMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());

    return locaties;
  }

  @Get(':id')
  async get(@Param('id', NumberPipe) id: number): Promise<CursusLocatie> {
    const locatie = await this.cursusLocatieMapper.get(id);
    if (locatie) {
      return locatie;
    } else {
      throw new NotFoundException();
    }
  }

  @Post()
  @Privileges('write:cursuslocaties')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() cursusLocatie: UpsertableCursusLocatie) {
    return this.cursusLocatieMapper.create(cursusLocatie);
  }

  @Put(':id')
  @Privileges('write:cursuslocaties')
  async update(
    @Param('id', NumberPipe) id: number,
    @Body() cursusLocatie: UpsertableCursusLocatie,
  ) {
    return this.cursusLocatieMapper.update(id, cursusLocatie);
  }

  @Delete(':id')
  @Privileges('write:cursuslocaties')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', NumberPipe) id: number): Promise<void> {
    return this.cursusLocatieMapper.delete(id);
  }
}
