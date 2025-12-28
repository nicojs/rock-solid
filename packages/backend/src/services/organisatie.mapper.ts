import * as db from '../../generated/prisma/index.js';
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
import { ExplicitNulls, purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import {
  DBAdresWithPlaats,
  toNullableAdres,
  toCreateAdresInput,
  toUpdateAdresInput,
  includeAdresWithPlaats,
} from './adres.mapper.js';
import { handleKnownPrismaErrors } from '../errors/prisma.js';
import {
  communicatievoorkeurMapper,
  foldersoortMapper,
  organisatiesoortMapper,
  provincieMapper,
} from './enum.mapper.js';

type DBOrganisatieContactAggregate = db.OrganisatieContact & {
  adres: DBAdresWithPlaats | null;
  foldervoorkeuren: db.Foldervoorkeur[];
};

type DBOrganisatieAggregate = db.Organisatie & {
  contacten: DBOrganisatieContactAggregate[];
  soorten: db.Organisatiesoort[];
};

const includeAggregate = Object.freeze({
  foldervoorkeuren: true as const,
  adres: includeAdresWithPlaats,
} as const satisfies db.Prisma.OrganisatieContactInclude);

@Injectable()
export class OrganisatieMapper {
  constructor(private db: DBService) {}

  public async getAll(
    filter: OrganisatieFilter,
    pageNumber: number | undefined,
  ): Promise<Organisatie[]> {
    const dbOrganisaties: DBOrganisatieAggregate[] =
      await this.db.organisatie.findMany({
        where: where(filter),
        orderBy: { naam: 'asc' },
        include: includeOrganisatie(filter),
        distinct: ['id'], // TODO: Remove when https://github.com/prisma/prisma/issues/28968 is fixed
        ...toPage(pageNumber),
      });

    return dbOrganisaties.map((org) => toOrganisatie(org));
  }

  public async count(filter: OrganisatieFilter): Promise<number> {
    // TODO: Change back when https://github.com/prisma/prisma/issues/28968 is fixed
    // const result = await this.db.organisatie.count({
    //   where: where(filter),
    // });
    // return result;
    const result = await this.db.organisatie.groupBy({
      by: ['id'],
      where: where(filter),
    });
    return result.length;
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
    const { contacten, id, soorten, ...props } =
      toUpdateOrganisatieFields(data);
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
            create: contacten
              .filter((contact) => empty(contact.id))
              .map(toCreateContactInput),
            update: contacten
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
            include: includeAggregate,
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

function where(filter: OrganisatieFilter): db.Prisma.OrganisatieWhereInput {
  const where: db.Prisma.OrganisatieWhereInput = {};
  const contactenWhereStatement = whereOrganisatieContacten(filter);
  if (Object.keys(contactenWhereStatement).length) {
    where.contacten = { some: contactenWhereStatement };
  }

  const { soorten, naam } = filter;
  if (naam) {
    where.naam = {
      contains: naam,
      // mode: 'insensitive',
    };
  }
  if (soorten) {
    where.soorten = {
      some: {
        soort: {
          in: soorten.map(organisatiesoortMapper.toDB),
        },
      },
    };
  }
  return where;
}

function whereOrganisatieContacten({
  folders,
  metAdres,
  provincie,
  emailadres,
}: Pick<
  OrganisatieFilter,
  'folders' | 'metAdres' | 'provincie' | 'emailadres'
>): db.Prisma.OrganisatieContactWhereInput {
  const whereContacten: db.Prisma.OrganisatieContactWhereInput = {};

  if (folders) {
    whereContacten.foldervoorkeuren = {
      some: {
        folder: {
          in: folders.map(foldersoortMapper.toDB),
        },
      },
    };
  }
  if (metAdres) {
    whereContacten.adres = { isNot: null };
  }
  if (provincie !== undefined) {
    whereContacten.adres = {
      plaats: {
        provincieId: provincieMapper.toDB(provincie),
      },
    };
  }
  if (emailadres) {
    whereContacten.emailadres = {
      contains: emailadres,
    };
  }
  return whereContacten;
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

function includeOrganisatie(filter?: OrganisatieFilter) {
  return {
    contacten: {
      include: includeAggregate,
      orderBy: {
        terAttentieVan: 'asc',
      },
      where: whereOrganisatieContacten(filter ?? {}),
    },
    soorten: true,
  } as const satisfies db.Prisma.OrganisatieInclude;
}

function toCreateContactInput(
  contact: UpsertableOrganisatieContact | OrganisatieContactUpdateFields,
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
  contact: OrganisatieContactUpdateFields,
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

type OrganisatieUpdateFields = ExplicitNulls<
  Omit<Organisatie, 'contacten'> & {
    contacten: OrganisatieContactUpdateFields[];
  }
>;

type OrganisatieContactUpdateFields = ExplicitNulls<OrganisatieContact>;

function toUpdateOrganisatieFields(org: Organisatie): OrganisatieUpdateFields {
  return {
    ...org,
    soortOpmerking: org.soortOpmerking ?? null,
    website: org.website ?? null,
    contacten: org.contacten.map((cont) => ({
      ...cont,
      terAttentieVan: cont.terAttentieVan ?? null,
      telefoonnummer: cont.telefoonnummer ?? null,
      emailadres: cont.emailadres ?? null,
      adres: cont.adres ?? null,
      afdeling: cont.afdeling ?? null,
    })),
  };
}
