import { Deelname, Deelnemer, UpsertableDeelname } from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import * as db from '@prisma/client';
import { DBService } from './db.service.js';
import {
  toPersoon,
  includePersoonAggregate,
  DBPersonAggregate,
} from './persoon.mapper.js';

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
        aanmelding: {
          include: { deelnemer: { include: includePersoonAggregate } },
        },
      },
      orderBy: { aanmelding: { deelnemer: { volledigeNaam: 'asc' } } },
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
  aanmelding: db.Aanmelding & {
    deelnemer: DBPersonAggregate | null;
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
    aanmelding: {
      connect: {
        id: deelname.aanmeldingId,
      },
    },
    effectieveDeelnamePerunage: deelname.effectieveDeelnamePerunage,
    opmerking: deelname.opmerking,
  };
}

function toDeelname(val: DeelnameQueryResult): Deelname {
  return {
    id: val.id,
    activiteitId: val.activiteitId,
    deelnemer: val.aanmelding.deelnemer
      ? (toPersoon(val.aanmelding.deelnemer) as Deelnemer)
      : undefined,
    aanmeldingId: val.aanmeldingId,
    effectieveDeelnamePerunage: val.effectieveDeelnamePerunage,
    opmerking: val.opmerking ?? undefined,
  };
}
