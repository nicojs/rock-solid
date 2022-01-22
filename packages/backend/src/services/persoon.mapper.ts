import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import * as db from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Persoon, PersoonFilter, UpsertablePersoon } from '@kei-crm/shared';
import { purgeNulls } from './mapper-utils';
import { toPage } from './paging';

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PersoonMapper {
  constructor(private db: DBService) {}

  async getOne(
    userWhereUniqueInput: Prisma.PersoonWhereUniqueInput,
  ): Promise<Persoon | null> {
    const persoon = await this.db.persoon.findUnique({
      where: userWhereUniqueInput,
    });
    return this.maybeToPersoon(persoon);
  }

  async getAll(
    filter: PersoonFilter,
    pageNumber: number | undefined,
  ): Promise<Persoon[]> {
    let people;
    switch (filter.searchType) {
      case 'text':
        people = await this.db.$queryRaw<
          db.Persoon[]
        >`SELECT * FROM persoon WHERE concat(voornaam, ' ', achternaam) ILIKE ${`%${filter.search}%`} AND type = ${
          filter.type
        };`;
        break;
      default:
        const { searchType, selectie, ...where } = filter;
        people = await this.db.persoon.findMany({
          where: {
            ...where,
            ...(selectie ? { AND: { selectie: { hasSome: selectie } } } : {}),
          },
          orderBy: [
            {
              achternaam: 'asc',
            },
            { voornaam: 'asc' },
          ],
          ...toPage(pageNumber),
        });
        break;
    }
    return people.map(toPersoon);
  }

  async count(filter: PersoonFilter): Promise<number> {
    let count;
    switch (filter.searchType) {
      case 'text':
        count = await this.db
          .$queryRaw<number>`SELECT COUNT(*) FROM persoon WHERE concat(voornaam, ' ', achternaam) ILIKE ${`%${filter.search}%`} AND type = ${
          filter.type
        };`;
        break;
      default:
        const { searchType, selectie, ...where } = filter;
        count = await this.db.persoon.count({
          where: {
            ...where,
            ...(selectie ? { AND: { selectie: { hasSome: selectie } } } : {}),
          },
        });
        break;
    }
    return count;
  }

  async createUser(data: UpsertablePersoon): Promise<Persoon> {
    return toPersoon(
      await this.db.persoon.create({
        data,
      }),
    );
  }

  async updateUser(params: {
    where: Prisma.PersoonWhereUniqueInput;
    data: UpsertablePersoon;
  }): Promise<Persoon> {
    return toPersoon(await this.db.persoon.update(params));
  }

  async deleteUser(where: Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return toPersoon(
      await this.db.persoon.delete({
        where,
      }),
    );
  }

  private maybeToPersoon(maybeP: db.Persoon | null): Persoon | null {
    return maybeP ? toPersoon(maybeP) : null;
  }
}

export function toPersoon(p: db.Persoon): Persoon {
  return purgeNulls(p);
}
