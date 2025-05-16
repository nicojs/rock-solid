import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { Locatie, LocatieFilter, UpsertableLocatie } from '@rock-solid/shared';
import * as db from '../../generated/prisma/index.js';
import { toPage } from './paging.js';

import {
  DBAdresWithPlaats,
  includeAdresWithPlaats,
  toCreateAdresInput,
  toNullableAdres,
  toUpdateAdresInput,
} from './adres.mapper.js';
import { ExplicitNulls } from './mapper-utils.js';
import { handleKnownPrismaErrors } from '../errors/index.js';

type DBLocatieAggregate = Omit<db.Locatie, 'adresId'> & {
  adres: DBAdresWithPlaats | null;
};

const includeAdres = Object.freeze({
  adres: includeAdresWithPlaats,
});

@Injectable()
export class LocatieMapper {
  constructor(private db: DBService) {}

  async getAll(
    filter: LocatieFilter | undefined,
    pageNumber: number | undefined,
  ): Promise<Locatie[]> {
    const dbLocaties = await this.db.locatie.findMany({
      where: where(filter),
      include: includeAdres,
      ...toPage(pageNumber),
    });

    return dbLocaties.map(toCursuslocatie);
  }

  async count(filter: LocatieFilter | undefined): Promise<number> {
    return this.db.locatie.count({
      where: where(filter),
    });
  }

  async get(id: number): Promise<Locatie | undefined> {
    const dbLocatie = await this.db.locatie.findFirst({
      where: { id },
      include: includeAdres,
    });

    if (dbLocatie) {
      return toCursuslocatie(dbLocatie);
    }
    return;
  }

  async create(cursusLocatie: UpsertableLocatie): Promise<Locatie> {
    const { adres, id, ...props } = toUpdateLocatieFields(cursusLocatie);
    const created = await handleKnownPrismaErrors(
      this.db.locatie.create({
        data: {
          ...props,
          adres: adres ? toCreateAdresInput(adres) : undefined,
        },
        include: includeAdres,
      }),
    );
    return toCursuslocatie(created);
  }

  async update(id: number, cursusLocatie: UpsertableLocatie) {
    const {
      adres,
      id: unused,
      ...props
    } = toUpdateLocatieFields(cursusLocatie);

    const { adresId } = await this.db.locatie.findUniqueOrThrow({
      where: { id },
      select: { adresId: true },
    });
    const updated = await handleKnownPrismaErrors(
      this.db.locatie.update({
        where: { id },
        data: {
          ...props,
          adres: toUpdateAdresInput(adres, adresId !== null),
        },
        include: includeAdres,
      }),
    );
    return toCursuslocatie(updated);
  }

  async delete(id: number) {
    await this.db.locatie.delete({ where: { id } });
  }
}

export function toCursuslocatie<
  T extends DBLocatieAggregate | undefined | null,
>(dbLocatie?: T): T extends undefined | null ? undefined : Locatie {
  if (!dbLocatie) {
    return undefined as T extends undefined | null ? undefined : Locatie;
  }
  return {
    id: dbLocatie.id,
    naam: dbLocatie.naam,
    adres: toNullableAdres(dbLocatie.adres),
    opmerking: dbLocatie.opmerking ?? undefined,
  } as T extends undefined | null ? undefined : Locatie;
}
function where(
  filter: LocatieFilter | undefined,
): db.Prisma.LocatieWhereInput | undefined {
  if (!filter) {
    return undefined;
  }

  return {
    naam: {
      contains: filter.naam,
    },
  };
}

type LocatieFields = ExplicitNulls<UpsertableLocatie>;

function toUpdateLocatieFields(locatie: UpsertableLocatie): LocatieFields {
  return {
    ...locatie,
    opmerking: locatie.opmerking ? locatie.opmerking : null,
    adres: locatie.adres ? locatie.adres : null,
    id: locatie.id ? locatie.id : null,
  };
}
