import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import prisma from '@prisma/client';

@Injectable()
export class DBService
  extends prisma.PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
