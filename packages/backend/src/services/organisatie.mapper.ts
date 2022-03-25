import * as db from '@prisma/client';
import {
  UpsertableOrganisatie,
  Organisatie,
  OrganisatieFilter,
} from '@kei-crm/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import { purgeNulls } from './mapper-utils';
import { toPage } from './paging';
import {
  toAdres,
  toCreateAdresInput,
  toNullableUpdateAdresInput,
} from './adres.mapper';

type DBOrganisatieWithAdres = db.Organisatie & {
  adres:
    | (db.Adres & {
        plaats: db.Plaats;
      })
    | null;
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
      include: includeAdres,
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
      include: includeAdres,
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
    const { adres, id, ...organisatieData } = organisatie;
    const dbOrganisatie = await this.db.organisatie.create({
      data: {
        ...organisatieData,
        adres: adres ? toCreateAdresInput(adres) : undefined,
      },
      include: includeAdres,
    });
    return toOrganisatie(dbOrganisatie);
  }

  async update({
    where,
    data,
  }: {
    where: db.Prisma.OrganisatieWhereUniqueInput;
    data: UpsertableOrganisatie;
  }): Promise<Organisatie> {
    const { adres, id, ...props } = data;
    const result = await this.db.organisatie.update({
      where,
      data: {
        adres: toNullableUpdateAdresInput(adres),
        ...props,
      },
      include: includeAdres,
    });
    if (!adres && result.adres) {
      return toOrganisatie(
        await this.db.organisatie.update({
          where,
          data: { adres: { delete: true } },
          include: includeAdres,
        }),
      );
    } else {
      return toOrganisatie(result);
    }
  }
}

function toWhere(filter: OrganisatieFilter): db.Prisma.OrganisatieWhereInput {
  return {
    folderVoorkeur: filter.folderVoorkeur
      ? {
          hasSome: filter.folderVoorkeur,
        }
      : undefined,
  };
}

function toOrganisatie(org: DBOrganisatieWithAdres): Organisatie {
  const { adres, adresId, ...props } = org;
  return {
    ...purgeNulls(props),
    adres: adres ? toAdres(adres) : undefined,
  };
}

const includeAdres = Object.freeze({
  adres: Object.freeze({ include: Object.freeze({ plaats: true as const }) }),
});
