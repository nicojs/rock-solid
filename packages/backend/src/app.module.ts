import { fileURLToPath } from 'url';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { PersonenController } from './personen.controller.js';
import { PersoonMapper } from './services/persoon.mapper.js';
import { DBService } from './services/db.service.js';
import { ProjectenController } from './projecten.controller.js';
import { ProjectMapper } from './services/project.mapper.js';
import { AanmeldingMapper } from './services/aanmelding.mapper.js';
import { DeelnameMapper } from './services/deelname.mapper.js';
import { OrganisatieMapper } from './services/organisatie.mapper.js';
import { OrganisatiesController } from './organisaties.controller.js';
import { PlaatsMapper } from './services/plaats.mapper.js';
import { PlaatsenController } from './plaatsen.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthModule, JwtAuthGuard } from './auth/index.js';
import { ReportsController } from './reports.controller.js';
import { ReportMapper } from './services/report.mapper.js';
import { APP_GUARD } from '@nestjs/core';
import { PrivilegesGuard } from './auth/privileges.guard.js';

const rootPath = fileURLToPath(
  new URL('../../../node_modules/@rock-solid/frontend/dist', import.meta.url),
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
    ReportsController,
  ],
  providers: [
    PersoonMapper,
    ProjectMapper,
    AanmeldingMapper,
    PlaatsMapper,
    OrganisatieMapper,
    DeelnameMapper,
    ReportMapper,
    { provide: 'DatabaseUrl', useValue: process.env['DATABASE_URL'] },
    DBService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PrivilegesGuard },
  ],
})
export class AppModule {}
