import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import prisma, { Prisma } from '../../generated/prisma/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class DBService
  extends prisma.PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject('DatabaseUrl') databaseUrl: string) {
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    super({
      adapter,
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
    // this.$on('query', (e) => {
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
