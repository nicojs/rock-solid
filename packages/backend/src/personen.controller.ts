import {
  Persoon,
  PersoonFilter,
  UpsertablePersoon,
  TOTAL_COUNT_HEADER,
} from '@rock-solid/shared';
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
import { PagePipe } from './pipes/page.pipe.js';
import { PersoonFilterPipe } from './pipes/persoon-filter.pipe.js';
import { PersoonMapper } from './services/persoon.mapper.js';
import { Response } from 'express';
import { JwtAuthGuard } from './auth/index.js';

@Controller({ path: 'personen' })
@UseGuards(JwtAuthGuard)
export class PersonenController {
  constructor(private readonly persoonService: PersoonMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(PersoonFilterPipe) filter: PersoonFilter,
    @Query('_page', PagePipe)
    page?: number,
  ): Promise<Persoon[]> {
    const [people, count] = await Promise.all([
      this.persoonService.getAll(filter, page),
      this.persoonService.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());
    return people;
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Persoon> {
    const persoon = await this.persoonService.getOne({ id: +id });
    if (persoon) {
      return persoon;
    } else {
      throw new NotFoundException();
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() persoon: UpsertablePersoon) {
    return this.persoonService.createPersoon(persoon);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() persoon: Persoon,
  ): Promise<Persoon> {
    return this.persoonService.updatePersoon({
      where: { id: +id },
      persoon: persoon,
    });
  }
}
