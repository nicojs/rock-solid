import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import prisma, { Prisma } from '../../generated/prisma/index.js';

@Injectable()
export class DBService
  extends prisma.PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject('DatabaseUrl') databaseUrl: string) {
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
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
