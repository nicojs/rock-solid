import { exec } from 'child_process';
import { promisify } from 'util';
import request from 'supertest';
import { config as chaiConfig } from 'chai';
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
  PersoonFilter,
  Persoon,
  UpsertableLocatie,
  LocatieFilter,
  Locatie,
  PAGE_QUERY_STRING_NAME,
  TOTAL_COUNT_HEADER,
  PatchableAanmelding,
  PatchablePersoon,
  PlaatsFilter,
} from '@rock-solid/shared';
import { INestApplication } from '@nestjs/common';
import bodyParser from 'body-parser';
import { toPlaats } from './services/plaats.mapper.js';
import { provincieMapper } from './services/enum.mapper.js';
import { DBService } from './services/db.service.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

/**
 * @see https://stackoverflow.com/questions/45881829/how-to-have-mocha-show-entire-object-in-diff-on-assertion-error
 */
chaiConfig.truncateThreshold = 0;
process.env.TZ = 'Etc/UTC';

const execAsync = promisify(exec);
const cwd = new URL('..', import.meta.url);

export interface GetAllResult<T> {
  body: T[];
  totalCount: number;
}

class IntegrationTestingHarness {
  private readonly app;
  private authToken?: string;
  public db;
  #addr;
  #seedPlaats?: Plaats;
  private constructor(app: INestApplication<Server>) {
    this.app = app;
    this.db = app.get(DBService);
    this.#addr = `http://localhost:${(this.app.getHttpServer().address() as AddressInfo).port}`;
  }

  static async init() {
    const dbName = `test${process.env['STRYKER_MUTATOR_WORKER'] ?? ''}`;
    const connectionUri = `file:./prisma/${dbName}.db`;
    console.log(`Started db@${connectionUri}`);
    await execAsync('npm run prisma:push:force', {
      env: {
        ...process.env,
        DATABASE_URL: connectionUri,
      },
      cwd,
    });
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DatabaseUrl')
      .useValue(connectionUri)
      .compile();

    const app = moduleFixture.createNestApplication({
      bodyParser: false,
    });
    app.use(bodyParser.json({ reviver: rockReviver }));
    await app.init();
    await app.listen(0, 'localhost');
    const harness = new IntegrationTestingHarness(app);
    await harness.clear();
    return harness;
  }

  get seedPlaats() {
    if (!this.#seedPlaats) {
      throw new Error('Seed plaats not set');
    }
    return this.#seedPlaats;
  }

  private async seed() {
    this.#seedPlaats = await this.insertPlaats(factory.plaats());
  }

  public async insertPlaats(plaats: Omit<Plaats, 'id'>): Promise<Plaats> {
    const { provincie, ...plaatsData } = plaats;
    const dbPlaats = await this.db.plaats.create({
      data: {
        ...plaatsData,
        provincieId: provincieMapper.toDB(provincie),
        volledigeNaam: `${plaats.gemeente} (${plaats.postcode})`,
      },
    });
    return toPlaats(dbPlaats);
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
    await this.db.$queryRaw`DELETE FROM Foldervoorkeur`;
    await this.db.$queryRaw`DELETE FROM Aanmelding`;
    await this.db.$queryRaw`DELETE FROM Deelname`;
    await this.db.$queryRaw`DELETE FROM Activiteit`;
    await this.db.$queryRaw`DELETE FROM OrganisatieContact`;
    await this.db.$queryRaw`DELETE FROM Organisatiesoort`;
    await this.db.$queryRaw`DELETE FROM Organisatie`;
    await this.db.$queryRaw`DELETE FROM "_PersoonToProject"`;
    await this.db.$queryRaw`DELETE FROM OverigPersoonSelectie`;
    await this.db.$queryRaw`DELETE FROM Persoon`;
    await this.db.$queryRaw`DELETE FROM Project`;
    await this.db.$queryRaw`DELETE FROM Locatie`;
    await this.db.$queryRaw`DELETE FROM Adres`;
    await this.db.$queryRaw`DELETE FROM Plaats`;
    await this.db
      .$queryRaw`UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = 'Plaats'`;
    await this.seed();
  }

  get(url: string, query?: Record<string, unknown>): request.Test {
    return this.wrapBodyRequest(
      request(this.#addr).get(url + toQueryString(query)),
    );
  }
  async getAll<T>(
    url: string,
    query?: Record<string, unknown>,
  ): Promise<{ body: T[]; totalCount: number }> {
    const response = await this.get(url, query).expect(200);
    return {
      body: response.body,
      totalCount: parseInt(response.get(TOTAL_COUNT_HEADER)!, 10),
    };
  }

  delete(url: string): request.Test {
    return this.wrapBodyRequest(request(this.#addr).delete(url));
  }

  post(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(request(this.#addr).post(url), body);
  }

  put(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(request(this.#addr).put(url), body);
  }
  patch(url: string, body?: string | object): request.Test {
    return this.wrapBodyRequest(request(this.#addr).patch(url), body);
  }

  private wrapBodyRequest(req: request.Test, body?: string | object) {
    req = req
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .parse(parseBody)
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

  public getAllProjecten(
    filter: ProjectFilter,
  ): Promise<GetAllResult<Project>> {
    return this.getAll(`/projecten${toQueryString(filter)}`);
  }

  public getPlaatsen(
    filter?: PlaatsFilter,
  ): Promise<GetAllResult<Plaats>> {
    return this.getAll(`/plaatsen${toQueryString(filter)}`);
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

  async updateAanmelding(aanmelding: UpdatableAanmelding): Promise<Aanmelding> {
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

  async patchPersoon(persoonId: number, persoon: PatchablePersoon): Promise<Persoon> {
    const response = await this.patch(
      `/personen/${persoonId}`,
      persoon,
    ).expect(200);
    return response.body;
  }

  async createProject<TProject extends UpsertableProject>(
    project: TProject,
  ): Promise<TProject extends { type: 'cursus' } ? Cursus : Vakantie> {
    const response = await this.post(`/projecten`, project).expect(201);
    return response.body;
  }

  async updateProject<TProject extends UpsertableProject>(
    project: TProject,
  ): Promise<TProject extends { type: 'cursus' } ? Cursus : Vakantie> {
    const response = await this.put(`/projecten/${project.id}`, project).expect(
      200,
    );
    return response.body;
  }

  async createLocatie(cursusLocatie: UpsertableLocatie): Promise<Locatie> {
    const response = await this.post(`/locaties`, cursusLocatie).expect(201);
    return response.body;
  }

  async updateLocatie(
    id: number,
    cursusLocatie: UpsertableLocatie,
  ): Promise<Locatie> {
    const response = await this.put(`/locaties/${id}`, cursusLocatie).expect(
      200,
    );
    return response.body;
  }

  async deleteLocatie(id: number): Promise<void> {
    await this.delete(`/locaties/${id}`).expect(204);
  }

  public async getAllLocaties(filter?: LocatieFilter): Promise<Locatie[]> {
    const request = this.get(`/locaties${toQueryString(filter)}`);
    const response = await request.expect(200);
    return response.body;
  }
  public async getLocatiesPage(
    page: number,
    filter?: LocatieFilter,
  ): Promise<[body: Locatie[], totalCount: number]> {
    const response = await this.get(
      `/locaties${toQueryString({
        ...filter,
        [PAGE_QUERY_STRING_NAME]: page,
      })}`,
    ).expect(200);
    return [response.body, +response.get(TOTAL_COUNT_HEADER)!];
  }

  public async getLocatie(id: number): Promise<Locatie> {
    const response = await this.get(`/locaties/${id}`).expect(200);
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

  getAllPersonen(filter: PersoonFilter): Promise<GetAllResult<Persoon>> {
    return this.getAll(`/personen${toQueryString(filter)}`);
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

  async patchAanmelding(
    projectId: number,
    aanmelding: PatchableAanmelding,
  ): Promise<Aanmelding> {
    const response = await this.patch(
      `/projecten/${projectId}/aanmeldingen/${aanmelding.id}`,
      aanmelding,
    ).expect(200);
    return response.body;
  }

  async patchAanmeldingen(
    projectId: number,
    aanmeldingen: PatchableAanmelding[],
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

  async getAllOrganisaties(
    filter: OrganisatieFilter,
  ): Promise<GetAllResult<Organisatie>> {
    return this.getAll(`/organisaties${toQueryString(filter)}`);
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
      provincie: 'Onbekend',
      ...overrides,
    };
  },

  adres(overrides?: Partial<UpsertableAdres>): UpsertableAdres {
    return {
      straatnaam: 'Onbekend',
      huisnummer: '1',
      plaats: harness.seedPlaats,
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
  overigPersoon(
    overrides?: Partial<UpsertableOverigPersoon>,
  ): UpsertableOverigPersoon {
    return {
      achternaam: 'OverigPersoon',
      type: 'overigPersoon',
      ...overrides,
    };
  },

  cursus(overrides?: Partial<UpsertableCursus>): UpsertableCursus {
    return {
      type: 'cursus',
      projectnummer: `00${seed++}`,
      naam: `Test project ${seed}`,
      activiteiten: [this.activiteit()],
      organisatieonderdeel: 'deKei',
      categorie: 'cursusMetOvernachting',
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

  locatie(overrides?: Partial<UpsertableLocatie>): UpsertableLocatie {
    return {
      naam: 'Onbekend',
      soort: 'cursushuis',
      ...overrides,
    };
  },
};

export let harness: IntegrationTestingHarness;

before(async () => {
  harness = await IntegrationTestingHarness.init();
});
after(async () => {
  await harness.dispose();
});

/**
 * Parses the response body as JSON using the Rock Solid reviver.
 * Grabbed from superagent, but altered for RockSolid
 * @param res The supertest response
 * @param cb The callback to invoke when response is parsed
 */
function parseBody(
  res: request.Response,
  cb: (err: Error | null, body: any) => void,
) {
  const contentType: string | undefined =
    res.headers['content-type']?.split(';')[0];
  switch (contentType) {
    case 'application/json':
      // See https://github.com/ladjs/superagent/blob/master/src/node/parsers/json.js
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
      break;
    case 'application/octet-stream': {
      // Grabbed from: https://github.com/ladjs/superagent/blob/master/src/node/parsers/image.js
      const data: any[] = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        cb(null, Buffer.concat(data));
      });
      break;
    }
    case undefined:
      cb(null, undefined);
      break;
    default:
      throw new Error(
        `Content-Type "${contentType}" is not supported yet by the test harness. Please add it to the "${parseBody.name}" function.`,
      );
  }
}

export function byId(
  a: { id: number } | undefined,
  b: { id: number } | undefined,
): number {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return -1;
  }
  if (!b) {
    return 1;
  }
  return a.id - b.id;
}
