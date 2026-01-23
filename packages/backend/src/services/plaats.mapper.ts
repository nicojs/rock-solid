import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import { PlaatsFilter, Plaats, Provincie } from '@rock-solid/shared';
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

  async upsertMany(
    plaatsen: Pick<Plaats, 'deelgemeente' | 'gemeente' | 'postcode'>[],
  ) {
    const upserts = plaatsen.map(({ deelgemeente, gemeente, postcode }) => {
      const volledigeNaam = `${postcode} ${deelgemeente} (${gemeente})`;
      const provincieId = provincieMapper.toDB(toProvincie(postcode));
      return this.db.plaats.upsert({
        where: {
          postcode_deelgemeente: { postcode, deelgemeente },
        },
        update: { gemeente, volledigeNaam, provincieId },
        create: {
          deelgemeente,
          gemeente,
          postcode,
          volledigeNaam,
          provincieId,
        },
      });
    });
    await this.db.$transaction(upserts);
  }
}

export function toPlaats(p: db.Plaats): Plaats {
  const { provincieId, volledigeNaam, ...props } = p;
  return { ...props, provincie: provincieMapper.toSchema(provincieId) };
}

function toProvincie(postCode: string): Provincie {
  const postnr = parseInt(postCode);

  if (postnr >= 1000 && postnr <= 1299) {
    return 'Brussels Hoofdstedelijk Gewest';
  }
  if (postnr >= 1300 && postnr <= 1499) {
    return 'Waals-Brabant';
  }
  if (
    (postnr >= 1500 && postnr <= 1999) ||
    (postnr >= 3000 && postnr <= 3499)
  ) {
    return 'Vlaams-Brabant';
  }
  if (postnr >= 2000 && postnr <= 2999) {
    return 'Antwerpen';
  }
  if (postnr >= 3500 && postnr <= 3999) {
    return 'Limburg';
  }
  if (postnr >= 4000 && postnr <= 4999) {
    return 'Luik';
  }
  if (postnr >= 5000 && postnr <= 5999) {
    return 'Namen';
  }
  if (
    (postnr >= 6000 && postnr <= 6599) ||
    (postnr >= 7000 && postnr <= 7999)
  ) {
    return 'Henegouwen';
  }
  if (postnr >= 6600 && postnr <= 6999) {
    return 'Luxemburg';
  }
  if (postnr >= 8000 && postnr <= 8999) {
    return 'West-Vlaanderen';
  }
  if (postnr >= 9000 && postnr <= 9999) {
    return 'Oost-Vlaanderen';
  }
  throw new Error(`Postcode invalid: "${postCode}"`);
  // 'Brussels Hoofdstedelijk Gewest': 1000-1299
  // 'Waals-Brabant': 1300-1499
  // 'Vlaams-Brabant': 1500-1999, 3000-3499
  // 'Antwerpen': 2000-2999
  // 'Limburg': 3500-3999
  // 'Luik': 4000-4999
  // 'Namen': 5000-5999
  // 'Henegouwen': 6000-6599,7000-7999
  // 'Luxemburg': 6600-6999
  // 'West-Vlaanderen': 8000-8999
  // 'Oost-Vlaanderen': 9000-9999
}
