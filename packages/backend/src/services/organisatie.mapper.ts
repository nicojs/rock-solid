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
      ...toPage(pageNumber),
    });
    return dbOrganisaties.map(toOrganisation);
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
    });
    if (org) {
      return toOrganisation(org);
    } else {
      return null;
    }
  }

  public async create(
    organisatie: UpsertableOrganisatie,
  ): Promise<Organisatie> {
    const dbOrganisatie = await this.db.organisatie.create({
      data: organisatie,
    });
    return toOrganisation(dbOrganisatie);
  }

  async update(params: {
    where: db.Prisma.OrganisatieWhereUniqueInput;
    data: UpsertableOrganisatie;
  }): Promise<Organisatie> {
    return toOrganisation(await this.db.organisatie.update(params));
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

function toOrganisation(org: db.Organisatie): Organisatie {
  return purgeNulls(org);
}
