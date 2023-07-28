import { exec } from 'child_process';
import { promisify } from 'util';
import request from 'supertest';
import * as db from '@prisma/client';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from 'testcontainers';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { JwtService } from '@nestjs/jwt';
import {
  Aanmelding,
  Deelnemer,
  GroupField,
  OverigPersoon,
  Project,
  ProjectReportFilter,
  ReportRoutes,
  InsertableAanmelding,
  UpsertableActiviteit,
  UpsertableDeelnemer,
  UpsertableOverigPersoon,
  UpsertablePersoon,
  UpsertableProject,
  User,
  rockReviver,
  toQueryString,
  UpdatableAanmelding,
} from '@rock-solid/shared';
import { INestApplication } from '@nestjs/common';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
const execAsync = promisify(exec);
const cwd = new URL('..', import.meta.url);

export class RockSolidDBContainer {
  private readonly db;
  private client;

  private constructor(db: StartedPostgreSqlContainer) {
    this.db = db;
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: this.connectionUri,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
    // this.client.$on('query', async (e) => {
    //   console.log(`${e.query} ${e.params}`);
    // });
  }

  static async start() {
    const postgres = await new PostgreSqlContainer().start();
    console.log(`Started database container@${postgres.getConnectionUri()}`);
    await execAsync('npm run prisma:push:force', {
      env: {
        ...process.env,
        DATABASE_URL: postgres.getConnectionUri(),
      },
      cwd,
    });
    const db = new RockSolidDBContainer(postgres);
    await db.init();
    return db;
  }

  private async init() {
    await execAsync('npm run prisma:push:force', {
      env: {
        ...process.env,
        DATABASE_URL: this.db.getConnectionUri(),
      },
      cwd,
    });
    await this.client.$connect();
    await this.seed();
  }

  private async seed() {
    const plaatsen: db.Prisma.PlaatsCreateManyInput[] = [
      {
        deelgemeente: 'Onbekend',
        gemeente: 'Onbekend',
        postcode: '0',
        provincieId: 1,
        volledigeNaam: 'Onbekend',
      },
    ];
    await this.client.plaats.createMany({ data: plaatsen });
  }

  /**
   * Clears all state from the database (except seeded data).
   */
  async clear(): Promise<void> {
    await this.client.$queryRaw`
      TRUNCATE TABLE foldervoorkeur, aanmelding, deelname, activiteit, organisatie_contact, organisatie, "_PersoonToProject", persoon, project RESTART IDENTITY;`;
    await this.client.$queryRaw`DELETE FROM plaats WHERE id > 1;`;
  }

  async stop() {
    await this.client.$disconnect();
    await this.db.stop();
  }

  get connectionUri() {
    return this.db.getConnectionUri();
  }
}

class IntegrationTestingHarness {
  private readonly app;
  private authToken?: string;
  constructor(app: INestApplication) {
    this.app = app;
  }

  static async init() {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DatabaseUrl')
      .useValue(rockSolidDBContainer.connectionUri)
      .compile();

    const app = moduleFixture.createNestApplication({
      bodyParser: false,
    });
    app.use(bodyParser.json({ reviver: rockReviver }));
    await app.init();
    return new IntegrationTestingHarness(app);
  }

  async dispose() {
    await Promise.all([this.app.close(), this.clear()]);
    seed = 0;
  }

  login(overrides?: Partial<User>) {
    const jwtService = this.app.get(JwtService);
    this.authToken = jwtService.sign(factory.user(overrides));
  }

  async clear() {
    this.authToken = undefined;
    await rockSolidDBContainer.clear();
  }

  get(url: string): request.Test {
    return this.authenticateRequest(request(this.app.getHttpServer()).get(url));
  }

  delete(url: string): request.Test {
    return this.authenticateRequest(
      request(this.app.getHttpServer()).delete(url),
    );
  }

  post(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(
      request(this.app.getHttpServer()).post(url),
      body,
    );
  }

  put(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(
      request(this.app.getHttpServer()).put(url),
      body,
    );
  }
  patch(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(
      request(this.app.getHttpServer()).patch(url),
      body,
    );
  }

  private wrapBodyRequest(req: request.Test, body?: string | object) {
    req = req
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body);
    return this.authenticateRequest(req);
  }
  private authenticateRequest(req: request.Test) {
    if (this.authToken) {
      req = req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  public async getReport<TReportRoute extends keyof ReportRoutes>(
    reportRoute: TReportRoute,
    group1: GroupField,
    group2?: GroupField,
    filter?: ProjectReportFilter,
  ): Promise<ReportRoutes[TReportRoute]['entity']> {
    const response = await this.get(
      `/${reportRoute}${toQueryString({
        by: group1,
        andBy: group2,
        ...filter,
      })}`,
    ).expect(200);
    return response.body;
  }

  async createAanmelding(
    aanmelding: InsertableAanmelding,
  ): Promise<Aanmelding> {
    const response = await this.post(
      `/projecten/${aanmelding.projectId}/aanmeldingen`,
      aanmelding,
    ).expect(201);
    return response.body;
  }

  async createProject(project: UpsertableProject): Promise<Project> {
    const response = await this.post(`/projecten`, project).expect(201);
    return response.body;
  }

  async createDeelnemer(deelnemer: UpsertableDeelnemer): Promise<Deelnemer> {
    return await this.createPersoon(deelnemer);
  }
  async createOverigPersoon(
    overigPersoon: UpsertableOverigPersoon,
  ): Promise<OverigPersoon> {
    return await this.createPersoon(overigPersoon);
  }

  async partialUpdateAanmeldingen(
    projectId: number,
    aanmeldingen: UpdatableAanmelding[],
  ): Promise<Aanmelding[]> {
    const response = await this.patch(
      `/projecten/${projectId}/aanmeldingen`,
      aanmeldingen,
    ).expect(200);
    return response.body;
  }

  private async createPersoon(persoon: UpsertablePersoon) {
    const response = await this.post(`/personen`, persoon).expect(201);
    return response.body;
  }
}

export let seed = 0;

export const factory = {
  user(overrides?: Partial<User>): User {
    return { name: 'Test User', email: '', role: 'admin', ...overrides };
  },

  deelnemer(overrides?: Partial<UpsertableDeelnemer>): UpsertableDeelnemer {
    return {
      achternaam: 'Deelnemer2',
      type: 'deelnemer',
      verblijfadres: {
        straatnaam: 'Onbekend',
        huisnummer: '1',
        plaats: {
          deelgemeente: 'Onbekend',
          gemeente: 'Onbekend',
          postcode: '0',
          provincie: 1,
          id: 1,
        },
      },
      ...overrides,
    };
  },

  project(overrides?: Partial<UpsertableProject>): UpsertableProject {
    return {
      projectnummer: `00${seed++}`,
      naam: `Test project ${seed}`,
      type: 'cursus',
      activiteiten: [this.activiteit()],
      ...overrides,
    };
  },

  activiteit(
    overrides?: Partial<UpsertableActiviteit> | Date,
  ): UpsertableActiviteit {
    if (overrides instanceof Date) {
      return {
        van: overrides,
        totEnMet: new Date(
          overrides.getFullYear(),
          overrides.getMonth(),
          overrides.getDate() + 2,
        ),
      };
    }
    return {
      van: new Date(2010, 1, 10),
      totEnMet: new Date(2010, 1, 12),
      ...overrides,
    };
  },
};

let rockSolidDBContainer: RockSolidDBContainer;
export let harness: IntegrationTestingHarness;

before(async () => {
  rockSolidDBContainer = await RockSolidDBContainer.start();
  harness = await IntegrationTestingHarness.init();
});
after(async () => {
  await harness.dispose();
  await rockSolidDBContainer.stop();
});
