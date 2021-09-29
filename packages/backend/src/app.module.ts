import path from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { PersonenController } from './personen.controller';
import { PersoonMapper } from './services/persoon.mapper';
import { DBService } from './services/db.service';
import { ProjectenController } from './projecten.controller';
import { ProjectMapper } from './services/project.mapper';

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
  controllers: [PersonenController, ProjectenController],
  providers: [PersoonMapper, ProjectMapper, DBService],
})
export class AppModule {}
