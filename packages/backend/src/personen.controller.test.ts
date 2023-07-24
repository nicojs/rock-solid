import { exec } from 'child_process';
import { promisify } from 'util';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from 'testcontainers';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module.js';
import { PersonenController } from './personen.controller.js';
import { JwtService } from '@nestjs/jwt';
import { User } from '@rock-solid/shared';
const execAsync = promisify(exec);
describe(PersonenController.name, () => {
  let app: INestApplication;
  let authToken: string;
  let db: StartedPostgreSqlContainer;

  before(async () => {
    db = await new PostgreSqlContainer().start();
    const cwd = new URL('..', import.meta.url);
    await execAsync('npm run prisma:push:force', {
      env: {
        ...process.env,
        DATABASE_URL: db.getConnectionUri(),
      },
      cwd,
    });
  });
  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DatabaseUrl')
      .useValue(db.getConnectionUri())
      .compile();

    const jwt = moduleFixture.get(JwtService);
    const login: User = {
      email: 'test@example.org',
      name: 'Test User',
    };
    authToken = jwt.sign(login);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/personen (GET)', () => {
    return request(app.getHttpServer())
      .get('/personen')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect([]);
  });
});
