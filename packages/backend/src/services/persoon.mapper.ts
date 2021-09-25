import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import * as db from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Persoon, UpsertablePersoon } from '@kei-crm/shared';
import { purgeNulls } from './mapper-utils';

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PersoonMapper {
  constructor(private db: DBService) {}

  async getOne(
    userWhereUniqueInput: Prisma.PersoonWhereUniqueInput,
  ): Promise<Persoon | null> {
    const persoon = await this.db.persoon.findUnique({
      where: userWhereUniqueInput,
    });
    return this.maybeToPersoon(persoon);
  }

  async getAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersoonWhereUniqueInput;
    where?: Prisma.PersoonWhereInput;
    orderBy?: Prisma.PersoonOrderByWithRelationInput;
  }): Promise<Persoon[]> {
    const people = await this.db.persoon.findMany(params);
    return people.map(this.toPersoon);
  }

  async createUser(data: UpsertablePersoon): Promise<Persoon> {
    return this.toPersoon(
      await this.db.persoon.create({
        data,
      }),
    );
  }

  async updateUser(params: {
    where: Prisma.PersoonWhereUniqueInput;
    data: UpsertablePersoon;
  }): Promise<Persoon> {
    return this.toPersoon(await this.db.persoon.update(params));
  }

  async deleteUser(where: Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return this.toPersoon(
      await this.db.persoon.delete({
        where,
      }),
    );
  }

  private toPersoon(p: db.Persoon): Persoon {
    return purgeNulls(p);
  }

  private maybeToPersoon(maybeP: db.Persoon | null): Persoon | null {
    return maybeP ? this.toPersoon(maybeP) : null;
  }
}
