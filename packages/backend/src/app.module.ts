import path from 'path';
import { fileURLToPath } from 'url';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { PersonenController } from './personen.controller.js';
import { PersoonMapper } from './services/persoon.mapper.js';
import { DBService } from './services/db.service.js';
import { ProjectenController } from './projecten.controller.js';
import { ProjectMapper } from './services/project.mapper.js';
import { InschrijvingMapper } from './services/inschrijving.mapper.js';
import { DeelnameMapper } from './services/deelname.mapper.js';
import { OrganisatieMapper } from './services/organisatie.mapper.js';
import { OrganisatiesController } from './organisaties.controller.js';
import { PlaatsMapper } from './services/plaats.mapper.js';
import { PlaatsenController } from './plaatsen.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthModule } from './auth/index.js';

const rootPath = fileURLToPath(
  new URL('../../node_modules/@rock-solid/frontend/dist', import.meta.url),
);
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath,
      exclude: ['/api*', '/auth*'],
    }),
    AuthModule,
  ],
  controllers: [
    PersonenController,
    ProjectenController,
    OrganisatiesController,
    PlaatsenController,
    AuthController,
  ],
  providers: [
    PersoonMapper,
    ProjectMapper,
    InschrijvingMapper,
    PlaatsMapper,
    OrganisatieMapper,
    DeelnameMapper,
    DBService,
  ],
})
export class AppModule {}
