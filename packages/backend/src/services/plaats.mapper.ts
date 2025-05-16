import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { PlaatsFilter, Plaats } from '@rock-solid/shared';
import * as db from '../../generated/prisma/index.js';
import { provincieMapper } from './enum.mapper.js';

/**
 * A data mapper for plaats
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PlaatsMapper {
  constructor(private db: DBService) {}

  async getAll(filter: PlaatsFilter): Promise<Plaats[]> {
    const plaatsen = await this.db.plaats.findMany({
      where: {
        volledigeNaam: { contains: filter.search },
      },
      orderBy: [{ volledigeNaam: 'asc' }],
    });
    return plaatsen.map(toPlaats);
  }
}

export function toPlaats(p: db.Plaats): Plaats {
  const { provincieId, volledigeNaam, ...props } = p;
  return { ...props, provincie: provincieMapper.toSchema(provincieId) };
}
