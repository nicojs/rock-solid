import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import prisma, { Prisma } from '@prisma/client';

@Injectable()
export class DBService
  extends prisma.PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
    // this.$on('query', async (e) => {
    //   console.log(`${e.query} ${e.params}`);
    // });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
