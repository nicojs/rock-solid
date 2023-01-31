import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import {
  Foldervoorkeur,
  Persoon,
  PersoonFilter,
  UpsertablePersoon,
} from '@rock-solid/shared';
import { purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import {
  toAdres,
  toCreateAdresInput,
  toUpdateAdresInput,
  toNullableUpdateAdresInput,
} from './adres.mapper.js';

export type DBPersonAggregate = db.Persoon & {
  verblijfadres: db.Adres & { plaats: db.Plaats };
  domicilieadres: (db.Adres & { plaats: db.Plaats }) | null;
  foldervoorkeuren: db.Foldervoorkeur[];
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
      include: includePersoonAggregate,
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
      include: includePersoonAggregate,
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
    const { verblijfadres, domicilieadres, id, ...props } = persoon;
    let foldervoorkeuren: Foldervoorkeur[] | undefined = undefined;
    if (props.type === 'overigPersoon') {
      foldervoorkeuren = props.foldervoorkeuren;
      delete props.foldervoorkeuren;
    }
    const dbPersoon = await this.db.persoon.create({
      data: {
        ...props,
        volledigeNaam: computeVolledigeNaam(props),
        verblijfadres: toCreateAdresInput(verblijfadres),
        domicilieadres: domicilieadres
          ? toCreateAdresInput(domicilieadres)
          : undefined,
        foldervoorkeuren: foldervoorkeuren
          ? {
              createMany: {
                data: foldervoorkeuren,
              },
            }
          : undefined,
      },
      include: includePersoonAggregate,
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
        foldervoorkeuren: toFoldervoorkeurInput(persoon),
      },
      include: includePersoonAggregate,
    });

    // Delete domicilieadres after the fact of needed (this is the only way)
    if (!domicilieadres && result.domicilieadres) {
      return toPersoon(
        await this.db.persoon.update({
          where,
          data: { domicilieadres: { delete: true } },
          include: includePersoonAggregate,
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
        include: includePersoonAggregate,
      }),
    );
  }

  private maybeToPersoon(maybeP: DBPersonAggregate | null): Persoon | null {
    return maybeP ? toPersoon(maybeP) : null;
  }
}

function computeVolledigeNaam({
  voornaam,
  achternaam,
}: Pick<Persoon, 'voornaam' | 'achternaam'>) {
  return `${voornaam ? `${voornaam} ` : ''}${achternaam}`;
}

export function toPersoon(p: DBPersonAggregate): Persoon {
  const {
    domicilieadres,
    domicilieadresId,
    verblijfadres,
    verblijfadresId,
    volledigeNaam,
    foldervoorkeuren,
    ...person
  } = p;
  return {
    ...purgeNulls(person),
    domicilieadres: domicilieadres ? toAdres(domicilieadres) : undefined,
    verblijfadres: toAdres(verblijfadres),
    foldervoorkeuren: foldervoorkeuren.map(toFoldervoorkeur),
  };
}

function toFoldervoorkeur(foldervoorkeur: db.Foldervoorkeur): Foldervoorkeur {
  return {
    communicatie: foldervoorkeur.communicatie,
    folder: foldervoorkeur.folder,
  };
}

function where(filter: PersoonFilter): db.Prisma.PersoonWhereInput {
  switch (filter.searchType) {
    case 'persoon':
      const {
        searchType,
        foldersoorten,
        selectie,
        laatsteInschrijvingJaarGeleden,
        ...where
      } = filter;
      return {
        ...where,
        ...(foldersoorten?.length
          ? { foldervoorkeuren: { some: { folder: { in: foldersoorten } } } }
          : {}),
        ...(selectie?.length ? { selectie: { hasSome: selectie } } : {}),
        ...(laatsteInschrijvingJaarGeleden !== undefined
          ? {
              inschrijvingen: {
                some: {
                  project: {
                    jaar: {
                      gte:
                        new Date().getFullYear() -
                        laatsteInschrijvingJaarGeleden,
                    },
                  },
                },
              },
            }
          : {}),
      };
    case 'text':
      return {
        volledigeNaam: { contains: filter.search, mode: 'insensitive' },
        type: filter.type,
      };
  }
}

export const includePersoonAggregate = Object.freeze({
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
  foldervoorkeuren: true,
} as const);

function toFoldervoorkeurInput(
  persoon: Persoon,
): db.Prisma.FoldervoorkeurUpdateManyWithoutPersoonNestedInput | undefined {
  if (persoon.type === 'overigPersoon') {
    return {
      deleteMany: {
        persoonId: persoon.id,
        folder: {
          notIn: persoon.foldervoorkeuren.map(({ folder }) => folder),
        },
      },
      upsert: persoon.foldervoorkeuren.map(({ communicatie, folder }) => ({
        where: {
          folder_persoonId: {
            folder,
            persoonId: persoon.id,
          },
        },
        create: { folder, communicatie },
        update: { folder, communicatie },
      })),
    };
  }
  return;
}
