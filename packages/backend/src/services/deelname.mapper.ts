import { Deelname, Deelnemer } from '@kei-crm/shared';
import { Injectable } from '@nestjs/common';
import * as db from '@prisma/client';
import { DBService } from './db.service';
import { toPersoon } from './persoon.mapper';

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
        deelnemer: true,
      },
    });
    return deelnames.map(toDeelname);
  }
}

interface DeelnameQueryResult extends db.Deelname {
  deelnemer: db.Persoon;
}

function toDeelname(val: DeelnameQueryResult): Deelname {
  return {
    id: val.id,
    activiteitId: val.activiteitId,
    deelnemer: toPersoon(val.deelnemer) as Deelnemer,
    deelnemerId: val.deelnemerId,
  };
}
