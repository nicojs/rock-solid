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
} from '@nestjs/common';
import {
  type CursusLocatieFilter,
  toCursusLocatieFilter,
  CursusLocatie,
  type UpsertableCursusLocatie,
} from '@rock-solid/shared';
import { CursusLocatieMapper } from './services/cursus-locatie.mapper.js';
import { Privileges } from './auth/privileges.guard.js';
import { NumberPipe } from './pipes/number.pipe.js';

@Controller({ path: 'cursus-locaties' })
export class CursusLocatiesController {
  constructor(private cursusLocatieMapper: CursusLocatieMapper) {}

  @Get()
  async getAll(
    @Query({ transform: toCursusLocatieFilter })
    filter: CursusLocatieFilter,
  ): Promise<CursusLocatie[]> {
    const locaties = await this.cursusLocatieMapper.getAll(filter);
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
  @Privileges('write:cursus-locaties')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() cursusLocatie: UpsertableCursusLocatie) {
    return this.cursusLocatieMapper.create(cursusLocatie);
  }

  @Put(':id')
  @Privileges('write:cursus-locaties')
  async update(
    @Param('id', NumberPipe) id: number,
    @Body() cursusLocatie: UpsertableCursusLocatie,
  ) {
    return this.cursusLocatieMapper.update(id, cursusLocatie);
  }

  @Delete(':id')
  @Privileges('write:cursus-locaties')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', NumberPipe) id: number): Promise<void> {
    return this.cursusLocatieMapper.delete(id);
  }
}
