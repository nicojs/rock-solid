import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import { Persoon, Prisma } from '@prisma/client';

@Injectable()
export class PersoonService {
  constructor(private db: DBService) {}

  async getOne(
    userWhereUniqueInput: Prisma.PersoonWhereUniqueInput,
  ): Promise<Persoon | null> {
    return this.db.persoon.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async getAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersoonWhereUniqueInput;
    where?: Prisma.PersoonWhereInput;
    orderBy?: Prisma.PersoonOrderByWithRelationInput;
  }): Promise<Persoon[]> {
    return this.db.persoon.findMany(params);
  }

  async createUser(data: Prisma.PersoonCreateInput): Promise<Persoon> {
    return this.db.persoon.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.PersoonWhereUniqueInput;
    data: Prisma.PersoonUpdateInput;
  }): Promise<Persoon> {
    const { where, data } = params;
    return this.db.persoon.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return this.db.persoon.delete({
      where,
    });
  }
}
