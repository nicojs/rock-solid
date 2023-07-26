import { PersonenController } from './personen.controller.js';
import {
  IntegrationTestingHarness,
  RockSolidDBContainer,
} from './test-utils.test.js';

describe(PersonenController.name, () => {
  let db: RockSolidDBContainer;
  let harness: IntegrationTestingHarness;

  before(async () => {
    db = await RockSolidDBContainer.start();
  });
  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clean();
    harness = await IntegrationTestingHarness.init(db);
    harness.login();
  });
  afterEach(async () => {
    await harness.close();
  });

  it('/personen (GET)', () => {
    return harness.get('/personen').expect(200).expect([]);
  });
});
