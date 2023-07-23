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
  toNullableCreateAdresInput,
  toNullableUpdateAdresInput,
} from './adres.mapper.js';
import { handleKnownPrismaErrors } from '../errors/prisma.js';

type DBOrganisatieContactAggregate = db.OrganisatieContact & {
  adres: DBAdresWithPlaats | null;
  foldervoorkeuren: db.Foldervoorkeur[];
};

type DBOrganisatieAggregate = db.Organisatie & {
  contacten: DBOrganisatieContactAggregate[];
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
        include: includeContacten(filter),
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
      include: includeContacten(),
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
    const { contacten, id, ...organisatieData } = organisatie;
    const dbOrganisatie = await handleKnownPrismaErrors(
      this.db.organisatie.create({
        data: {
          ...organisatieData,
          contacten: {
            create: contacten.map(toCreateContactInput),
          },
        },
        include: includeContacten(),
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
    const { contacten, id, ...props } = data;

    const result = await handleKnownPrismaErrors(
      this.db.organisatie.update({
        where,
        data: {
          ...props,
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
              .map(toUpdateContactInput),
          },
        },
        include: includeContacten(),
      }),
    );

    // Delete addresses that needs to be deleted
    for (const contact of contacten) {
      const updatedContactIndex = result.contacten.findIndex(
        ({ id }) => contact.id === id,
      );
      const updatedContact = result.contacten[updatedContactIndex];
      if (!contact.adres && updatedContact?.adres) {
        result.contacten[updatedContactIndex] =
          await this.db.organisatieContact.update({
            where: { id: updatedContact.id },
            data: { adres: { delete: true } },
            include: {
              ...includeAdres,
              ...includeFoldervoorkeuren,
            },
          });
      }
    }

    return toOrganisatie(result);
  }
}

function toWhere({
  folders,
}: OrganisatieFilter): db.Prisma.OrganisatieWhereInput {
  return {
    contacten: {
      some: {
        foldervoorkeuren: folders
          ? {
              some: {
                folder: { in: folders },
              },
            }
          : undefined,
      },
    },
  };
}

function toOrganisatie(org: DBOrganisatieAggregate): Organisatie {
  const { contacten, ...props } = org;
  return {
    ...purgeNulls(props),
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
    communicatie: foldervoorkeur.communicatie,
    folder: foldervoorkeur.folder,
  };
}

const includeAdres = Object.freeze({
  adres: Object.freeze({ include: Object.freeze({ plaats: true as const }) }),
});

const includeFoldervoorkeuren = Object.freeze({
  foldervoorkeuren: true as const,
});

function includeContacten(filter?: OrganisatieFilter) {
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
                folder: { in: filter.folders },
              },
            },
          }
        : undefined,
    },
  } as const;
}

function toCreateContactInput(
  contact: UpsertableOrganisatieContact,
): db.Prisma.OrganisatieContactCreateWithoutOrganisatieInput {
  const { adres, id, foldervoorkeuren, ...props } = contact;
  return {
    ...props,
    adres: toNullableCreateAdresInput(adres),
    terAttentieVan: props.terAttentieVan ?? '', // Empty string so we can use the unique key constraint
    foldervoorkeuren: {
      create: foldervoorkeuren?.map(({ communicatie, folder }) => ({
        communicatie,
        folder,
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
      adres: toNullableUpdateAdresInput(contact.adres),
      foldervoorkeuren: {
        deleteMany: {
          organisatieContactId: contact.id,
          folder: {
            notIn: contact.foldervoorkeuren.map(({ folder }) => folder),
          },
        },
        upsert: contact.foldervoorkeuren.map(({ communicatie, folder }) => ({
          where: {
            folder_organisatieContactId: {
              folder,
              organisatieContactId: contact.id,
            },
          },
          create: { folder, communicatie },
          update: { folder, communicatie },
        })),
      },
    },
  };
}
