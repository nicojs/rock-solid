import * as db from '@prisma/client';
import {
  UpsertableOrganisatie,
  Organisatie,
  OrganisatieFilter,
  OrganisatieContact,
  UpsertableOrganisatieContact,
  Foldervoorkeur,
  notEmpty,
  empty,
} from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import {
  DBAdresWithPlaats,
  toNullableAdres,
  toCreateAdresInput,
  toUpdateAdresInput,
} from './adres.mapper.js';
import { handleKnownPrismaErrors } from '../errors/prisma.js';
import {
  communicatievoorkeurMapper,
  foldersoortMapper,
  organisatiesoortMapper,
} from './enum.mapper.js';

type DBOrganisatieContactAggregate = db.OrganisatieContact & {
  adres: DBAdresWithPlaats | null;
  foldervoorkeuren: db.Foldervoorkeur[];
};

type DBOrganisatieAggregate = db.Organisatie & {
  contacten: DBOrganisatieContactAggregate[];
  soorten: db.Organisatiesoort[];
};

@Injectable()
export class OrganisatieMapper {
  constructor(private db: DBService) {}

  public async getAll(
    filter: OrganisatieFilter,
    pageNumber: number | undefined,
  ): Promise<Organisatie[]> {
    const dbOrganisaties: DBOrganisatieAggregate[] =
      await this.db.organisatie.findMany({
        where: toWhere(filter),
        orderBy: { naam: 'asc' },
        include: includeOrganisatie(filter),
        ...toPage(pageNumber),
      });

    return dbOrganisaties.map(toOrganisatie);
  }

  public async count(filter: OrganisatieFilter): Promise<number> {
    return await this.db.organisatie.count({
      where: toWhere(filter),
    });
  }

  async getOne(
    where: db.Prisma.OrganisatieWhereUniqueInput,
  ): Promise<Organisatie | null> {
    const org = await this.db.organisatie.findUnique({
      where: where,
      include: includeOrganisatie(),
    });
    if (org) {
      return toOrganisatie(org);
    } else {
      return null;
    }
  }

  public async create(
    organisatie: UpsertableOrganisatie,
  ): Promise<Organisatie> {
    const { contacten, id, soorten, ...organisatieData } = organisatie;
    const dbOrganisatie = await handleKnownPrismaErrors(
      this.db.organisatie.create({
        data: {
          ...organisatieData,
          soorten: {
            create: soorten?.map((soort) => ({
              soort: organisatiesoortMapper.toDB(soort),
            })),
          },
          contacten: {
            create: contacten.map(toCreateContactInput),
          },
        },
        include: includeOrganisatie(),
      }),
    );
    return toOrganisatie(dbOrganisatie);
  }

  async update({
    where,
    data,
  }: {
    where: { id: number };
    data: Organisatie;
  }): Promise<Organisatie> {
    const { contacten, id, soorten, ...props } = data;
    const dbSoorten = soorten.map(organisatiesoortMapper.toDB);
    const result = await handleKnownPrismaErrors(
      this.db.organisatie.update({
        where,
        data: {
          ...props,
          soorten: {
            deleteMany: {
              organisatieId: where.id,
              soort: { notIn: dbSoorten },
            },
            connectOrCreate: dbSoorten.map((dbSoort) => ({
              where: {
                organisatieId_soort: {
                  organisatieId: where.id,
                  soort: dbSoort,
                },
              },
              create: { soort: dbSoort },
            })),
          },
          // Update and create contacts that need to be updated or deleted
          contacten: {
            deleteMany: {
              organisatieId: where.id,
              id: {
                notIn: contacten.map(({ id }) => id).filter(notEmpty),
              },
            },
            create: data.contacten
              .filter((contact) => empty(contact.id))
              .map(toCreateContactInput),
            update: data.contacten
              .filter((contact) => notEmpty(contact.id))
              .map((contact) => toUpdateContactInput(contact)),
          },
        },
        include: includeOrganisatie(),
      }),
    );

    // Delete addresses that needs to be deleted, cannot be done in one sweep, because of https://github.com/prisma/prisma/issues/20448
    await Promise.all(
      contacten.map(async (contact) => {
        const updatedContact = result.contacten.find(
          ({ id }) => contact.id === id,
        );
        if (!contact.adres && updatedContact?.adres) {
          await this.db.organisatieContact.update({
            where: { id: updatedContact.id },
            data: { adres: { delete: true } },
            include: {
              ...includeAdres,
              ...includeFoldervoorkeuren,
            },
          });
          updatedContact.adres = null;
        }
      }),
    );

    return toOrganisatie(result);
  }

  async delete(id: number): Promise<void> {
    await handleKnownPrismaErrors(
      this.db.organisatie.delete({
        where: { id },
      }),
    );
  }
}

function toWhere({
  folders,
  naam,
}: OrganisatieFilter): db.Prisma.OrganisatieWhereInput {
  const where: db.Prisma.OrganisatieWhereInput = {};
  if (folders) {
    where.contacten = {
      some: {
        foldervoorkeuren: folders
          ? {
              some: {
                folder: {
                  in: folders.map(foldersoortMapper.toDB),
                },
              },
            }
          : undefined,
      },
    };
  }
  if (naam) {
    where.naam = {
      contains: naam,
      // mode: 'insensitive',
    };
  }
  return where;
}

function toOrganisatie(org: DBOrganisatieAggregate): Organisatie {
  const { contacten, soorten, ...props } = org;
  return {
    ...purgeNulls(props),
    soorten: soorten.map(({ soort }) => organisatiesoortMapper.toSchema(soort)),
    contacten: contacten.map(toContact),
  };
}

function toContact(contact: DBOrganisatieContactAggregate): OrganisatieContact {
  const { organisatieId, foldervoorkeuren, adresId, adres, ...props } = contact;
  return {
    ...purgeNulls(props),
    adres: toNullableAdres(adres),
    foldervoorkeuren: foldervoorkeuren.map(toFoldervoorkeur),
  };
}

function toFoldervoorkeur(foldervoorkeur: db.Foldervoorkeur): Foldervoorkeur {
  return {
    communicatie: communicatievoorkeurMapper.toSchema(
      foldervoorkeur.communicatie,
    ),
    folder: foldersoortMapper.toSchema(foldervoorkeur.folder),
  };
}

const includeAdres = Object.freeze({
  adres: Object.freeze({ include: Object.freeze({ plaats: true as const }) }),
});

const includeFoldervoorkeuren = Object.freeze({
  foldervoorkeuren: true as const,
});

function includeOrganisatie(filter?: OrganisatieFilter) {
  return {
    contacten: {
      include: {
        ...includeAdres,
        ...includeFoldervoorkeuren,
      },
      orderBy: {
        terAttentieVan: 'asc',
      },
      where: filter?.folders
        ? {
            foldervoorkeuren: {
              some: {
                folder: {
                  in: filter.folders.map(foldersoortMapper.toDB),
                },
              },
            },
          }
        : undefined,
    },
    soorten: true,
  } as const satisfies db.Prisma.OrganisatieInclude;
}

function toCreateContactInput(
  contact: UpsertableOrganisatieContact,
): db.Prisma.OrganisatieContactCreateWithoutOrganisatieInput {
  const { adres, id, foldervoorkeuren, ...props } = contact;
  return {
    ...props,
    adres: toCreateAdresInput(adres),
    terAttentieVan: props.terAttentieVan ?? '', // Empty string so we can use the unique key constraint
    foldervoorkeuren: {
      create: foldervoorkeuren?.map(({ communicatie, folder }) => ({
        communicatie: communicatievoorkeurMapper.toDB(communicatie),
        folder: foldersoortMapper.toDB(folder),
      })),
    },
  };
}

function toUpdateContactInput(
  contact: OrganisatieContact,
): db.Prisma.OrganisatieContactUpdateWithWhereUniqueWithoutOrganisatieInput {
  return {
    where: { id: contact.id },
    data: {
      ...toCreateContactInput(contact),
      // we provide false here and delete it afterwards, because of issue https://github.com/prisma/prisma/issues/20448
      adres: toUpdateAdresInput(contact.adres, false),
      foldervoorkeuren: {
        deleteMany: {
          organisatieContactId: contact.id,
          folder: {
            notIn: contact.foldervoorkeuren.map(({ folder }) =>
              foldersoortMapper.toDB(folder),
            ),
          },
        },
        upsert: contact.foldervoorkeuren.map(
          ({
            communicatie,
            folder,
          }): db.Prisma.FoldervoorkeurUpsertWithWhereUniqueWithoutOrganisatieContactInput => {
            const dbFolder = foldersoortMapper.toDB(folder);
            const dbCommunicatie =
              communicatievoorkeurMapper.toDB(communicatie);
            return {
              where: {
                folder_organisatieContactId: {
                  folder: dbFolder,
                  organisatieContactId: contact.id,
                },
              },
              create: { folder: dbFolder, communicatie: dbCommunicatie },
              update: { folder: dbFolder, communicatie: dbCommunicatie },
            };
          },
        ),
      },
    },
  };
}
