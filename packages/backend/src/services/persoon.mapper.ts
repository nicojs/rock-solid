import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import * as db from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Persoon, PersoonFilter, UpsertablePersoon } from '@kei-crm/shared';
import { purgeNulls } from './mapper-utils';
import { toPage } from './paging';
import { toAdres } from './adres.mapper';

type DBPersonWithAdres = db.Persoon & {
  adres: db.Adres & { plaats: db.Plaats };
};

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
      include: includeAdres,
    });
    return this.maybeToPersoon(persoon);
  }

  async getAll(
    filter: PersoonFilter,
    pageNumber: number | undefined,
  ): Promise<Persoon[]> {
    const people = await this.db.persoon.findMany({
      where: where(filter),
      orderBy: [
        {
          achternaam: 'asc',
        },
        { voornaam: 'asc' },
      ],
      include: includeAdres,
      ...toPage(pageNumber),
    });
    return people.map(toPersoon);
  }

  async count(filter: PersoonFilter): Promise<number> {
    const count = await this.db.persoon.count({
      where: where(filter),
    });
    return count;
  }

  async createPersoon(data: UpsertablePersoon): Promise<Persoon> {
    const {
      adres: { id: adresId, plaats, ...newAdres },
      id,
      ...rest
    } = data;
    return toPersoon(
      await this.db.persoon.create({
        data: {
          ...rest,
          volledigeNaam: computeVolledigeNaam(rest),
          adres: {
            create: {
              ...newAdres,
              plaats: { connect: { id: plaats.id } },
            },
          },
        },
        include: includeAdres,
      }),
    );
  }

  async updateUser({
    where,
    data,
  }: {
    where: Prisma.PersoonWhereUniqueInput;
    data: Persoon;
  }): Promise<Persoon> {
    const { id: personId, adres, ...props } = data;
    const { plaats, id, ...adresProps } = adres;
    const p = await this.db.persoon.update({
      where,
      data: {
        ...props,
        volledigeNaam: computeVolledigeNaam(props),
        adres: {
          update: {
            ...adresProps,
            plaats: {
              connect: {
                id: plaats.id,
              },
            },
          },
        },
      },
      include: {
        adres: {
          include: {
            plaats: true,
          },
        },
      },
    });
    return toPersoon(p);
  }

  async deleteUser(where: Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return toPersoon(
      await this.db.persoon.delete({
        where,
        include: includeAdres,
      }),
    );
  }

  private maybeToPersoon(maybeP: DBPersonWithAdres | null): Persoon | null {
    return maybeP ? toPersoon(maybeP) : null;
  }
}

function computeVolledigeNaam({
  voornaam,
  achternaam,
}: Pick<Persoon, 'voornaam' | 'achternaam'>) {
  return `${voornaam ? `${voornaam} ` : ''}${achternaam}`;
}

export function toPersoon(p: DBPersonWithAdres): Persoon {
  const { adres, adresId, volledigeNaam, ...person } = p;
  return {
    ...purgeNulls(person),
    adres: toAdres(adres),
  };
}

function where(filter: PersoonFilter): db.Prisma.PersoonWhereInput {
  switch (filter.searchType) {
    case 'persoon':
      const { searchType, selectie, ...where } = filter;
      return {
        ...where,
        ...(selectie ? { AND: { selectie: { hasSome: selectie } } } : {}),
      };
    case 'text':
      return {
        volledigeNaam: { contains: filter.search, mode: 'insensitive' },
        type: filter.type,
      };
  }
}

const includeAdres = {
  adres: {
    include: {
      plaats: true,
    },
  },
} as const;
