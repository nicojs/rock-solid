import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { Locatie, LocatieFilter, UpsertableLocatie } from '@rock-solid/shared';
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
import { locatiesoortMapper } from './enum.mapper.js';

export type DBLocatieAggregate = Omit<db.Locatie, 'adresId'> & {
  adres: DBAdresWithPlaats | null;
};

export const includeAdres = Object.freeze({
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

    return dbLocaties.map(toLocatie);
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
      return toLocatie(dbLocatie);
    }
    return;
  }

  async create(cursusLocatie: UpsertableLocatie): Promise<Locatie> {
    const { adres, id, soort, ...props } = toUpdateLocatieFields(cursusLocatie);
    const created = await handleKnownPrismaErrors(
      this.db.locatie.create({
        data: {
          ...props,
          soort: locatiesoortMapper.toDB(soort),
          adres: adres ? toCreateAdresInput(adres) : undefined,
        },
        include: includeAdres,
      }),
    );
    return toLocatie(created);
  }

  async update(id: number, cursusLocatie: UpsertableLocatie) {
    const {
      adres,
      id: unused,
      soort,
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
          soort: locatiesoortMapper.toDB(soort),
          adres: toUpdateAdresInput(adres, adresId !== null),
        },
        include: includeAdres,
      }),
    );
    return toLocatie(updated);
  }

  async delete(id: number) {
    await this.db.locatie.delete({ where: { id } });
  }
}

export function toLocatie<T extends DBLocatieAggregate | undefined | null>(
  dbLocatie?: T,
): T extends undefined | null ? undefined : Locatie {
  if (!dbLocatie) {
    return undefined as T extends undefined | null ? undefined : Locatie;
  }
  return {
    id: dbLocatie.id,
    naam: dbLocatie.naam,
    adres: toNullableAdres(dbLocatie.adres),
    opmerking: dbLocatie.opmerking ?? undefined,
    soort: locatiesoortMapper.toSchema(dbLocatie.soort),
    geschiktVoorVakantie: dbLocatie.geschiktVoorVakantie ?? undefined,
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
    soort: filter.soort ? locatiesoortMapper.toDB(filter.soort) : undefined,
  };
}

type LocatieFields = ExplicitNulls<UpsertableLocatie>;

function toUpdateLocatieFields(locatie: UpsertableLocatie): LocatieFields {
  return {
    ...locatie,
    opmerking: locatie.opmerking ?? null,
    adres: locatie.adres ?? null,
    id: locatie.id ?? null,
    geschiktVoorVakantie: locatie.geschiktVoorVakantie ?? null,
  };
}
