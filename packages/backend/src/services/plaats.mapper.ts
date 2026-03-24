import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import {
  PlaatsFilter,
  Plaats,
  UpsertablePlaats,
  plaatsToString,
  toProvincie,
} from '@rock-solid/shared';
import * as db from '../../generated/prisma/index.js';
import { provincieMapper } from './enum.mapper.js';
import { toPage } from './paging.js';
/**
 * A data mapper for plaats
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PlaatsMapper {
  constructor(private db: DBService) {}

  async getAll(
    filter: PlaatsFilter,
    pageNumber: number | undefined,
  ): Promise<Plaats[]> {
    const plaatsen = await this.db.plaats.findMany({
      where: {
        volledigeNaam: { contains: filter.search },
      },
      orderBy: [{ volledigeNaam: 'asc' }],
      ...toPage(pageNumber),
    });
    return plaatsen.map(toPlaats);
  }
  async count(filter: PlaatsFilter): Promise<number> {
    const count = await this.db.plaats.count({
      where: {
        volledigeNaam: { contains: filter.search },
      },
    });
    return count;
  }

}

export function toPlaatsConnectOrCreate(
  plaats: UpsertablePlaats,
): { connect: { id: number } } | { connectOrCreate: db.Prisma.PlaatsCreateOrConnectWithoutAdressenInput } {
  if (plaats.id) {
    return { connect: { id: plaats.id } };
  }
  const { postcode, deelgemeente, land, gemeente } = plaats;
  const provincieId = provincieMapper.toDB(toProvincie(postcode));
  const volledigeNaam = plaatsToString(plaats);
  return {
    connectOrCreate: {
      where: {
        postcode_deelgemeente_land: { postcode, deelgemeente, land },
      },
      create: {
        deelgemeente,
        gemeente,
        postcode,
        volledigeNaam,
        provincieId,
        land,
      },
    },
  };
}

export function toPlaats(p: db.Plaats): Plaats {
  const { provincieId, volledigeNaam, ...props } = p;
  return { ...props, provincie: provincieMapper.toSchema(provincieId) };
}

