import {
  Persoon,
  PersoonFilter,
  UpsertablePersoon,
  TOTAL_COUNT_HEADER,
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
} from '@nestjs/common';
import { PagePipe } from './pipes/page.pipe';
import { PersoonFilterPipe } from './pipes/persoon-filter.pipe';
import { PersoonMapper } from './services/persoon.mapper';
import { Response } from 'express';

@Controller({ path: 'personen' })
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() persoon: Persoon,
  ): Promise<void> {
    await this.persoonService.updatePersoon({ where: { id: +id }, persoon: persoon });
  }
}
