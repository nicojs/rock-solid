import path from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './personen.controller';
import { PersoonService } from './services/persoon.service';
import { DBService } from './services/db.service';

const rootPath = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '@kei-crm',
  'frontend',
  'dist',
);
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath,
      exclude: ['/api*'],
    }),
  ],
  controllers: [AppController],
  providers: [PersoonService, DBService],
})
export class AppModule {}
