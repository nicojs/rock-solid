import { Persoon, PersoonFilter, UpsertablePersoon } from '@kei-crm/shared';
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
} from '@nestjs/common';
import { PersoonMapper } from './services/persoon.mapper';

@Controller({ path: 'personen' })
export class PersonenController {
  constructor(private readonly persoonService: PersoonMapper) {}

  @Get()
  getAll(@Query() filter: PersoonFilter): Promise<Persoon[]> {
    return this.persoonService.getAll(filter);
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
    return this.persoonService.createUser(persoon);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() persoon: UpsertablePersoon,
  ): Promise<void> {
    await this.persoonService.updateUser({ where: { id: +id }, data: persoon });
  }
}
