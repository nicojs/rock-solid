import * as db from '@prisma/client';
import {
  UpsertableOrganisatie,
  Organisatie,
  OrganisatieFilter,
  OrganisatieContact,
  UpsertableOrganisatieContact,
  notEmpty,
  empty,
} from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import { DBAdresWithPlaats, toNullableAdres } from './adres.mapper.js';

type DBOrganisatieContactWithAdres = db.OrganisatieContact & {
  adres: DBAdresWithPlaats | null;
};

type DBOrganisatieWithContacten = db.Organisatie & {
  contacten: DBOrganisatieContactWithAdres[];
};

@Injectable()
export class OrganisatieMapper {
  constructor(private db: DBService) {}

  public async getAll(
    filter: OrganisatieFilter,
    pageNumber: number | undefined,
  ): Promise<Organisatie[]> {
    const dbOrganisaties = await this.db.organisatie.findMany({
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
    const { adres, contacten, id, ...organisatieData } = organisatie;
    const dbOrganisatie = await this.db.organisatie.create({
      data: {
        ...organisatieData,
        contacten: {
          create: contacten.map(toCreateContactInput),
        },
      },
      include: includeContacten(),
    });
    return toOrganisatie(dbOrganisatie);
  }

  async update({
    where,
    data,
  }: {
    where: { id: number };
    data: UpsertableOrganisatie;
  }): Promise<Organisatie> {
    const { contacten, id, ...props } = data;

    // Delete contacts that need to be deleted
    await this.db.organisatieContact.deleteMany({
      where: {
        organisatieId: where.id,
        id: {
          notIn: contacten.map(({ id }) => id).filter(notEmpty),
        },
      },
    });

    const result = await this.db.organisatie.update({
      where,
      data: {
        ...props,
        // Update and create contacts that need to be updated or deleted
        contacten: {
          create: data.contacten
            .filter((contact) => empty(contact.id))
            .map(toCreateContactInput),
          updateMany: data.contacten
            .filter((contact) => notEmpty(contact.id))
            .map(toUpdateManyContactInput),
        },
      },
      include: includeContacten(),
    });

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
            include: includeAdres,
          });
      }
    }

    return toOrganisatie(result);
  }
}

function toWhere(filter: OrganisatieFilter): db.Prisma.OrganisatieWhereInput {
  return {
    contacten: {
      some: {
        folderVoorkeur: filter.folderVoorkeur
          ? {
              hasSome: filter.folderVoorkeur,
            }
          : undefined,
      },
    },
  };
}

function toOrganisatie(org: DBOrganisatieWithContacten): Organisatie {
  const { contacten, ...props } = org;
  return {
    ...purgeNulls(props),
    contacten: contacten.map(toContact),
  };
}

function toContact(contact: DBOrganisatieContactWithAdres): OrganisatieContact {
  const { organisatieId, adresId, adres, ...props } = contact;
  return {
    ...purgeNulls(props),
    adres: toNullableAdres(adres),
  };
}

const includeAdres = Object.freeze({
  adres: Object.freeze({ include: Object.freeze({ plaats: true as const }) }),
});

function includeContacten(filter?: OrganisatieFilter): {
  contacten: Omit<db.Prisma.OrganisatieContactFindManyArgs, 'include'> & {
    include: typeof includeAdres;
  };
} {
  return {
    contacten: {
      include: includeAdres,
      orderBy: {
        terAttentieVan: 'asc',
      },
      where: filter
        ? {
            folderVoorkeur: filter.folderVoorkeur
              ? {
                  hasSome: filter.folderVoorkeur,
                }
              : undefined,
          }
        : undefined,
    },
  };
}

function toCreateContactInput(
  contact: UpsertableOrganisatieContact,
): db.Prisma.OrganisatieContactCreateWithoutOrganisatieInput {
  const { adres, id, ...props } = contact;
  return {
    ...props,
    terAttentieVan: props.terAttentieVan ?? '', // Empty string so we can use the unique key contraint
  };
}

function toUpdateManyContactInput(
  contact: UpsertableOrganisatieContact,
): db.Prisma.OrganisatieContactUpdateManyWithWhereWithoutOrganisatieInput {
  return {
    where: { id: contact.id },
    data: toCreateContactInput(contact),
  };
}
