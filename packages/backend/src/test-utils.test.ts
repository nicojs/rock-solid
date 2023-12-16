import { exec } from 'child_process';
import { promisify } from 'util';
import request from 'supertest';
import chai from 'chai';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { JwtService } from '@nestjs/jwt';
import {
  Aanmelding,
  Deelnemer,
  OverigPersoon,
  Project,
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
  UpsertableOrganisatie,
  Organisatie,
  UpsertableOrganisatieContact,
  Plaats,
  UpsertableDeelname,
  parse,
  UpsertableVakantie,
  UpsertableCursus,
  ProjectFilter,
  OrganisatieFilter,
  Cursus,
  Vakantie,
  AanmeldingOf,
  UpsertableAdres,
} from '@rock-solid/shared';
import { INestApplication } from '@nestjs/common';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { toPlaats } from './services/plaats.mapper.js';

/**
 * @see https://stackoverflow.com/questions/45881829/how-to-have-mocha-show-entire-object-in-diff-on-assertion-error
 */
chai.config.truncateThreshold = 0;

const execAsync = promisify(exec);
const cwd = new URL('..', import.meta.url);

export class RockSolidDBContainer {
  private readonly db;
  private client;
  #seedPlaats?: Plaats;

  get seedPlaats() {
    if (!this.#seedPlaats) {
      throw new Error('Seed plaats not set');
    }
    return this.#seedPlaats;
  }

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
    await this.client.$connect();
    await this.seed();
  }

  private async seed() {
    this.#seedPlaats = await this.insertPlaats(factory.plaats());
  }

  public async insertPlaats(plaats: Omit<Plaats, 'id'>): Promise<Plaats> {
    const { provincie, ...plaatsData } = plaats;
    const dbPlaats = await this.client.plaats.create({
      data: {
        ...plaatsData,
        provincieId: provincie,
        volledigeNaam: `${plaats.gemeente} (${plaats.postcode})`,
      },
    });
    return toPlaats(dbPlaats);
  }

  /**
   * Clears all state from the database (except seeded data).
   */
  async clear(): Promise<void> {
    await this.client.$queryRaw`
      TRUNCATE TABLE foldervoorkeur, aanmelding, deelname, activiteit, organisatie_contact, organisatie, "_PersoonToProject", persoon, project, adres, plaats RESTART IDENTITY;`;
    await this.seed();
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
  public db = rockSolidDBContainer;
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

  get(url: string, query?: Record<string, unknown>): request.Test {
    return this.wrapBodyRequest(
      request(this.app.getHttpServer()).get(url + toQueryString(query)),
    );
  }

  delete(url: string): request.Test {
    return this.wrapBodyRequest(request(this.app.getHttpServer()).delete(url));
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
      .parse(parseJson)
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
    group1: ReportRoutes[TReportRoute]['grouping'],
    group2?: ReportRoutes[TReportRoute]['grouping'],
    filter?: ReportRoutes[TReportRoute]['filter'],
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

  public async getProject(id: number): Promise<Project> {
    const response = await this.get(`/projecten/${id}`).expect(200);
    return response.body;
  }

  public async getAllProjecten(filter: ProjectFilter): Promise<Project[]> {
    const response = await this.get(
      `/projecten${toQueryString(filter)}`,
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

  async updateAanmelding(aanmelding: Aanmelding): Promise<Aanmelding> {
    const response = await this.put(
      `/projecten/${aanmelding.projectId}/aanmeldingen/${aanmelding.id}`,
      aanmelding,
    ).expect(200);
    return response.body;
  }

  async updateDeelnames(
    projectId: number,
    activiteitId: number,
    deelnames: UpsertableDeelname[],
  ): Promise<void> {
    await this.put(
      `/projecten/${projectId}/activiteiten/${activiteitId}/deelnames`,
      deelnames,
    ).expect(204);
  }

  async createProject<TProject extends UpsertableProject>(
    project: TProject,
  ): Promise<TProject extends { type: 'cursus' } ? Cursus : Vakantie> {
    const response = await this.post(`/projecten`, project).expect(201);
    return response.body;
  }

  async createDeelnemer(deelnemer: UpsertableDeelnemer): Promise<Deelnemer> {
    return await this.createPersoon(deelnemer);
  }
  async updateDeelnemer(deelnemer: Deelnemer): Promise<Deelnemer> {
    const response = await this.put(
      `/personen/${deelnemer.id}`,
      deelnemer,
    ).expect(200);
    return response.body;
  }
  async getDeelnemer(deelnemerId: number): Promise<Deelnemer> {
    const response = await this.get(`/personen/${deelnemerId}`).expect(200);
    return response.body;
  }

  async deleteDeelnemer(id: number): Promise<void> {
    await this.delete(`/personen/${id}`).expect(204);
  }

  async getAanmeldingen(projectId: number): Promise<Aanmelding[]> {
    const response = await this.get(`/projecten/${projectId}/aanmeldingen`);
    return response.body;
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

  async getDeelnemerProjectAanmeldingen<TFilter extends ProjectFilter>(
    deelnemerId: number,
    filter: TFilter,
  ): Promise<
    AanmeldingOf<TFilter extends { type: 'cursus' } ? Cursus : Vakantie>[]
  > {
    const response = await this.get(
      `/personen/${deelnemerId}/aanmeldingen`,
      filter,
    ).expect(200);
    return response.body;
  }

  async getAllOrganisaties(filter: OrganisatieFilter): Promise<Organisatie[]> {
    const response = await this.get(
      `/organisaties${toQueryString(filter)}`,
    ).expect(200);
    return response.body;
  }

  async createOrganisatie(
    org?: Partial<UpsertableOrganisatie>,
  ): Promise<Organisatie> {
    const response = await this.post(
      '/organisaties',
      factory.organisatie(org),
    ).expect(201);
    return response.body;
  }

  async updateOrganisatie(org: Organisatie): Promise<Organisatie> {
    const response = await this.put(`/organisaties/${org.id}`, org).expect(200);
    return response.body;
  }
  async getOrganisatie(orgId: number): Promise<Organisatie> {
    const response = await this.get(`/organisaties/${orgId}`).expect(200);
    return response.body;
  }
}

export let seed = 0;

export const factory = {
  user(overrides?: Partial<User>): User {
    return { name: 'Test User', email: '', role: 'admin', ...overrides };
  },

  organisatie(
    overrides?: Partial<UpsertableOrganisatie>,
  ): UpsertableOrganisatie {
    return {
      naam: `Test organisatie ${seed++}`,
      contacten: [this.organisatieContact()],
      ...overrides,
    };
  },

  organisatieContact(
    overrides?: Partial<UpsertableOrganisatieContact>,
  ): UpsertableOrganisatieContact {
    return {
      ...overrides,
    };
  },

  plaats(overrides?: Partial<Omit<Plaats, 'id'>>): Omit<Plaats, 'id'> {
    return {
      deelgemeente: 'Onbekend',
      gemeente: 'Onbekend',
      postcode: '0',
      provincie: 1,
      ...overrides,
    };
  },

  adres(overrides?: Partial<UpsertableAdres>): UpsertableAdres {
    return {
      straatnaam: 'Onbekend',
      huisnummer: '1',
      plaats: rockSolidDBContainer.seedPlaats,
      ...overrides,
    };
  },

  deelnemer(overrides?: Partial<UpsertableDeelnemer>): UpsertableDeelnemer {
    return {
      achternaam: 'Deelnemer2',
      type: 'deelnemer',
      verblijfadres: this.adres(),
      ...overrides,
    };
  },

  cursus(overrides?: Partial<UpsertableCursus>): UpsertableCursus {
    return {
      type: 'cursus',
      projectnummer: `00${seed++}`,
      naam: `Test project ${seed}`,
      activiteiten: [this.activiteit()],
      ...overrides,
    };
  },

  vakantie(overrides?: Partial<UpsertableVakantie>): UpsertableVakantie {
    return {
      projectnummer: `00${seed++}`,
      naam: `Test vakantie ${seed}`,
      type: 'vakantie',
      bestemming: 'Beach',
      land: 'Spain',
      activiteiten: [this.activiteit()],
      ...overrides,
    };
  },

  activiteit(overrides?: Partial<UpsertableActiviteit>): UpsertableActiviteit {
    const van = overrides?.van ?? new Date(2010, 1, 10);
    return {
      van,
      totEnMet: new Date(van.getFullYear(), van.getMonth(), van.getDate() + 2),
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

/**
 * Parses the response body as JSON using the Rock Solid reviver.
 * Grabbed from superagent, but altered for RockSolid
 * @see https://github.com/ladjs/superagent/blob/master/src/node/parsers/json.js
 * @param res The supertest response
 * @param cb The callback to invoke when response is parsed
 */
function parseJson(
  res: request.Response,
  cb: (err: Error | null, body: any) => void,
) {
  res.text = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    res.text += chunk;
  });
  res.on('end', () => {
    let body;
    type SupertestError = Error & {
      rawResponse: string | null;
      statusCode: number;
    };

    let error: SupertestError | null = null;
    try {
      body = res.text && parse(res.text);
    } catch (err: any) {
      error = err as SupertestError;
      error.rawResponse = res.text || null;
      error.statusCode = res.statusCode;
    } finally {
      cb(error, body);
    }
  });
}
