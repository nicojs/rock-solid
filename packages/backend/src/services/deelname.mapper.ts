import { Deelname, Deelnemer, UpsertableDeelname } from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import * as db from '@prisma/client';
import { DBService } from './db.service.js';
import { toPersoon, includePersoonAdres } from './persoon.mapper.js';

/**
 * A data mapper for deelname
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class DeelnameMapper {
  constructor(private db: DBService) {}

  async getAll({
    projectId,
    activiteitId,
  }: {
    projectId: number;
    activiteitId: number;
  }): Promise<Deelname[]> {
    const deelnames = await this.db.deelname.findMany({
      where: {
        activiteitId,
        AND: {
          activiteit: {
            projectId,
          },
        },
      },
      include: {
        inschrijving: {
          include: { deelnemer: { include: includePersoonAdres } },
        },
      },
    });
    return deelnames.map(toDeelname);
  }

  async updateAll({
    activiteitId,
    deelnames,
  }: {
    projectId: number;
    activiteitId: number;
    deelnames: UpsertableDeelname[];
  }): Promise<void> {
    await this.db.$transaction(
      deelnames.map((deelname) => {
        if (deelname.id) {
          return this.db.deelname.update({
            where: { id: deelname.id },
            data: toDBDeelname(activiteitId, deelname),
          });
        } else {
          return this.db.deelname.create({
            data: toDBDeelname(activiteitId, deelname),
          });
        }
      }),
    );
  }
}

interface DeelnameQueryResult extends db.Deelname {
  inschrijving: db.Inschrijving & {
    deelnemer: db.Persoon & {
      verblijfadres: db.Adres & {
        plaats: db.Plaats;
      };
      domicilieadres:
        | (db.Adres & {
            plaats: db.Plaats;
          })
        | null;
    };
  };
}

function toDBDeelname(
  activiteitId: number,
  deelname: UpsertableDeelname,
): db.Prisma.DeelnameCreateInput {
  return {
    activiteit: {
      connect: {
        id: activiteitId,
      },
    },
    inschrijving: {
      connect: {
        id: deelname.inschrijvingId,
      },
    },
    effectieveDeelnamePerunage: deelname.effectieveDeelnamePerunage,
  };
}

function toDeelname(val: DeelnameQueryResult): Deelname {
  return {
    id: val.id,
    activiteitId: val.activiteitId,
    deelnemer: toPersoon(val.inschrijving.deelnemer) as Deelnemer,
    inschrijvingId: val.inschrijvingId,
    effectieveDeelnamePerunage: val.effectieveDeelnamePerunage,
  };
}
