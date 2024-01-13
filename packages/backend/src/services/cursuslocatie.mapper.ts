import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import {
  CursusLocatie,
  CursusLocatieFilter,
  UpsertableCursusLocatie,
} from '@rock-solid/shared';
import * as db from '@prisma/client';
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

type DBCursusLocatieAggregate = Omit<db.CursusLocatie, 'adresId'> & {
  adres: DBAdresWithPlaats | null;
};

const includeAdres = Object.freeze({
  adres: includeAdresWithPlaats,
});

@Injectable()
export class CursuslocatieMapper {
  constructor(private db: DBService) {}

  async getAll(
    filter: CursusLocatieFilter | undefined,
    pageNumber: number | undefined,
  ): Promise<CursusLocatie[]> {
    const dbCursusLocaties = await this.db.cursusLocatie.findMany({
      where: where(filter),
      include: includeAdres,
      ...toPage(pageNumber),
    });

    return dbCursusLocaties.map(toCursuslocatie);
  }

  async count(filter: CursusLocatieFilter | undefined): Promise<number> {
    return this.db.cursusLocatie.count({
      where: where(filter),
    });
  }

  async get(id: number): Promise<CursusLocatie | undefined> {
    const dbCursusLocatie = await this.db.cursusLocatie.findFirst({
      where: { id },
      include: includeAdres,
    });

    if (dbCursusLocatie) {
      return toCursuslocatie(dbCursusLocatie);
    }
    return;
  }

  async create(cursusLocatie: UpsertableCursusLocatie): Promise<CursusLocatie> {
    const { adres, id, ...props } = toUpdateCursusLocatieFields(cursusLocatie);
    const created = await handleKnownPrismaErrors(
      this.db.cursusLocatie.create({
        data: {
          ...props,
          adres: adres ? toCreateAdresInput(adres) : undefined,
        },
        include: includeAdres,
      }),
    );
    return toCursuslocatie(created);
  }

  async update(id: number, cursusLocatie: UpsertableCursusLocatie) {
    const {
      adres,
      id: unused,
      ...props
    } = toUpdateCursusLocatieFields(cursusLocatie);

    const { adresId } = await this.db.cursusLocatie.findUniqueOrThrow({
      where: { id },
      select: { adresId: true },
    });
    const updated = await handleKnownPrismaErrors(
      this.db.cursusLocatie.update({
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
    await this.db.cursusLocatie.delete({ where: { id } });
  }
}

export function toCursuslocatie<
  T extends DBCursusLocatieAggregate | undefined | null,
>(dbCursusLocatie?: T): T extends undefined | null ? undefined : CursusLocatie {
  if (!dbCursusLocatie) {
    return undefined as T extends undefined | null ? undefined : CursusLocatie;
  }
  return {
    id: dbCursusLocatie.id,
    naam: dbCursusLocatie.naam,
    adres: toNullableAdres(dbCursusLocatie.adres),
  } as T extends undefined | null ? undefined : CursusLocatie;
}
function where(
  filter: CursusLocatieFilter | undefined,
): db.Prisma.CursusLocatieWhereInput | undefined {
  if (!filter) {
    return undefined;
  }

  return {
    naam: {
      contains: filter.naam,
    },
  };
}

type CursusLocatieFields = ExplicitNulls<UpsertableCursusLocatie>;

function toUpdateCursusLocatieFields(
  cursusLocatie: UpsertableCursusLocatie,
): CursusLocatieFields {
  return {
    ...cursusLocatie,
    adres: cursusLocatie.adres ? cursusLocatie.adres : null,
    id: cursusLocatie.id ? cursusLocatie.id : null,
  };
}
