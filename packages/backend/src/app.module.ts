import path from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { PersonenController } from './personen.controller';
import { PersoonMapper } from './services/persoon.mapper';
import { DBService } from './services/db.service';
import { ProjectenController } from './projecten.controller';
import { ProjectMapper } from './services/project.mapper';
import { InschrijvingMapper } from './services/inschrijving.mapper';
import { DeelnameMapper } from './services/deelname.mapper';
import { OrganisatieMapper } from './services/organisatie.mapper';
import { OrganisatiesController } from './organisaties.controller';

const rootPath = path.resolve(
  __dirname,
  '..',
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
  controllers: [
    PersonenController,
    ProjectenController,
    OrganisatiesController,
  ],
  providers: [
    PersoonMapper,
    ProjectMapper,
    InschrijvingMapper,
    OrganisatieMapper,
    DeelnameMapper,
    DBService,
  ],
})
export class AppModule {}
