import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import { Persoon, PersoonFilter, UpsertablePersoon } from '@rock-solid/shared';
import { purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import {
  toAdres,
  toCreateAdresInput,
  toUpdateAdresInput,
  toNullableUpdateAdresInput,
} from './adres.mapper.js';

type DBPersonWithAdres = db.Persoon & {
  verblijfadres: db.Adres & { plaats: db.Plaats };
  domicilieadres: (db.Adres & { plaats: db.Plaats }) | null;
};

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PersoonMapper {
  constructor(private db: DBService) {}

  async getOne(
    userWhereUniqueInput: db.Prisma.PersoonWhereUniqueInput,
  ): Promise<Persoon | null> {
    const persoon = await this.db.persoon.findUnique({
      where: userWhereUniqueInput,
      include: includePersoonAdres,
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
      include: includePersoonAdres,
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

  async createPersoon(persoon: UpsertablePersoon): Promise<Persoon> {
    const { verblijfadres, domicilieadres, id, ...rest } = persoon; // cast to deelnemer, so we can pick off the domicilieadres
    const dbPersoon = await this.db.persoon.create({
      data: {
        ...rest,
        volledigeNaam: computeVolledigeNaam(rest),
        verblijfadres: toCreateAdresInput(verblijfadres),
        domicilieadres: domicilieadres
          ? toCreateAdresInput(domicilieadres)
          : undefined,
      },
      include: includePersoonAdres,
    });
    return toPersoon(dbPersoon);
  }

  async updatePersoon({
    where,
    persoon,
  }: {
    where: db.Prisma.PersoonWhereUniqueInput;
    persoon: Persoon;
  }): Promise<Persoon> {
    const { id: personId, verblijfadres, domicilieadres, ...props } = persoon;
    const result = await this.db.persoon.update({
      where,
      data: {
        ...props,
        volledigeNaam: computeVolledigeNaam(props),
        verblijfadres: toUpdateAdresInput(verblijfadres),
        domicilieadres: toNullableUpdateAdresInput(domicilieadres),
      },
      include: includePersoonAdres,
    });
    // Delete domicilieadres after the fact of needed (this is the only way)
    if (!domicilieadres && result.domicilieadres) {
      return toPersoon(
        await this.db.persoon.update({
          where,
          data: { domicilieadres: { delete: true } },
          include: includePersoonAdres,
        }),
      );
    } else {
      return toPersoon(result);
    }
  }

  async deleteUser(where: db.Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return toPersoon(
      await this.db.persoon.delete({
        where,
        include: includePersoonAdres,
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
  const {
    domicilieadres,
    domicilieadresId,
    verblijfadres,
    verblijfadresId,
    volledigeNaam,
    ...person
  } = p;
  return {
    ...purgeNulls(person),
    domicilieadres: domicilieadres ? toAdres(domicilieadres) : undefined,
    verblijfadres: toAdres(verblijfadres),
  };
}

function where(filter: PersoonFilter): db.Prisma.PersoonWhereInput {
  switch (filter.searchType) {
    case 'persoon':
      const { searchType, folderVoorkeur, selectie, ...where } = filter;
      return {
        ...where,
        ...(folderVoorkeur
          ? { folderVoorkeur: { hasSome: folderVoorkeur } }
          : {}),
        ...(selectie ? { selectie: { hasSome: selectie } } : {}),
      };
    case 'text':
      return {
        volledigeNaam: { contains: filter.search, mode: 'insensitive' },
        type: filter.type,
      };
  }
}

export const includePersoonAdres = Object.freeze({
  verblijfadres: Object.freeze({
    include: Object.freeze({
      plaats: true,
    }),
  }),
  domicilieadres: Object.freeze({
    include: Object.freeze({
      plaats: true,
    }),
  }),
} as const);
