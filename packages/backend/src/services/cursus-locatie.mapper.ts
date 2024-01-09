import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import {
  CursusLocatie,
  CursusLocatieFilter,
  UpsertableCursusLocatie,
} from '@rock-solid/shared';
import * as db from '@prisma/client';
import {
  DBAdresWithPlaats,
  toAdres,
  toCreateAdresInput,
  toNullableAdres,
  toUpdateAdresInput,
} from './adres.mapper.js';
import { ExplicitNulls } from './mapper-utils.js';

type DBCursusLocatieAggregate = db.CursusLocatie & {
  adres: DBAdresWithPlaats | null;
};

const includeAdres = Object.freeze({
  adres: Object.freeze({ include: Object.freeze({ plaats: true as const }) }),
});

@Injectable()
export class CursusLocatieMapper {
  constructor(private db: DBService) {}

  async getAll(
    filter: CursusLocatieFilter | undefined,
  ): Promise<CursusLocatie[]> {
    const dbCursusLocaties = await this.db.cursusLocatie.findMany({
      where: where(filter),
      include: includeAdres,
    });

    return dbCursusLocaties.map(toCursusLocatie);
  }

  async get(id: number): Promise<CursusLocatie | undefined> {
    const dbCursusLocatie = await this.db.cursusLocatie.findFirst({
      where: { id },
      include: includeAdres,
    });

    if (dbCursusLocatie) {
      return toCursusLocatie(dbCursusLocatie);
    }
    return;
  }

  async create(cursusLocatie: UpsertableCursusLocatie): Promise<CursusLocatie> {
    const { adres, id, ...props } = toUpdateCursusLocatieFields(cursusLocatie);
    const created = await this.db.cursusLocatie.create({
      data: {
        ...props,
        adres: adres ? toCreateAdresInput(adres) : undefined,
      },
      include: includeAdres,
    });
    return toCursusLocatie(created);
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
    const updated = await this.db.cursusLocatie.update({
      where: { id },
      data: {
        ...props,
        adres: toUpdateAdresInput(adres, adresId !== null),
      },
      include: includeAdres,
    });
    return toCursusLocatie(updated);
  }

  async delete(id: number) {
    await this.db.cursusLocatie.delete({ where: { id } });
  }
}

function toCursusLocatie(
  dbCursusLocatie: DBCursusLocatieAggregate,
): CursusLocatie {
  return {
    id: dbCursusLocatie.id,
    naam: dbCursusLocatie.naam,
    adres: toNullableAdres(dbCursusLocatie.adres),
  };
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
