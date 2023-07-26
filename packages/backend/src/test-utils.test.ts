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
  OverigPersoon,
  Project,
  UpsertableAanmelding,
  UpsertableActiviteit,
  UpsertableDeelnemer,
  UpsertableOverigPersoon,
  UpsertablePersoon,
  UpsertableProject,
  User,
  rockReviver,
} from '@rock-solid/shared';
import { INestApplication } from '@nestjs/common';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
const execAsync = promisify(exec);
const cwd = new URL('..', import.meta.url);

export class RockSolidDBContainer {
  private readonly db;

  private constructor(db: StartedPostgreSqlContainer) {
    this.db = db;
  }

  static async start() {
    const postgres = await new PostgreSqlContainer().start();
    return new RockSolidDBContainer(postgres);
  }

  async clean() {
    await execAsync('npm run prisma:push:force', {
      env: {
        ...process.env,
        DATABASE_URL: this.db.getConnectionUri(),
      },
      cwd,
    });
    await this.seed();
  }

  async seed() {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: this.connectionUri,
        },
      },
    });
    try {
      await client.$connect();
      const plaatsen: db.Prisma.PlaatsCreateManyInput[] = [
        {
          deelgemeente: 'Onbekend',
          gemeente: 'Onbekend',
          postcode: '0',
          provincieId: 1,
          volledigeNaam: 'Onbekend',
        },
      ];
      await client.plaats.createMany({ data: plaatsen });
    } finally {
      await client.$disconnect();
    }
  }

  stop() {
    return this.db.stop();
  }

  get connectionUri() {
    return this.db.getConnectionUri();
  }
}

export class IntegrationTestingHarness {
  private readonly app;
  private authToken?: string;
  constructor(app: INestApplication) {
    this.app = app;
  }

  static async init(db: RockSolidDBContainer) {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DatabaseUrl')
      .useValue(db.connectionUri)
      .compile();

    const app = moduleFixture.createNestApplication({
      bodyParser: false,
    });
    app.use(bodyParser.json({ reviver: rockReviver }));
    await app.init();
    return new IntegrationTestingHarness(app);
  }

  close() {
    return this.app.close();
  }

  login(user: User = { name: 'Test User', email: '' }) {
    const jwtService = this.app.get(JwtService);
    this.authToken = jwtService.sign(user);
  }

  get(url: string): request.Test {
    let onGoingRequest = request(this.app.getHttpServer()).get(url);
    if (this.authToken) {
      onGoingRequest = onGoingRequest.set(
        'Authorization',
        `Bearer ${this.authToken}`,
      );
    }
    return onGoingRequest;
  }

  post(url: string, body?: string | object): request.Test {
    let onGoingRequest = request(this.app.getHttpServer())
      .post(url)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body);
    if (this.authToken) {
      onGoingRequest = onGoingRequest.set(
        'Authorization',
        `Bearer ${this.authToken}`,
      );
    }
    return onGoingRequest;
  }

  async createAanmelding(
    aanmelding: UpsertableAanmelding,
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

  private async createPersoon(persoon: UpsertablePersoon) {
    const response = await this.post(`/personen`, persoon).expect(201);
    return response.body;
  }
}

let seed = 0;

export const factory = {
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
      projectnummer: `00${seed++}}`,
      naam: `Test project ${seed}`,
      type: 'cursus',
      activiteiten: [this.activiteit()],
      ...overrides,
    };
  },

  activiteit(overrides?: Partial<UpsertableActiviteit>): UpsertableActiviteit {
    return {
      van: new Date(2010, 1, 10),
      totEnMet: new Date(2010, 1, 12),
      ...overrides,
    };
  },
};
