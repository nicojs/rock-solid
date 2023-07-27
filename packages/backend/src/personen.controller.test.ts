import { PersonenController } from './personen.controller.js';
import { IntegrationTestingHarness } from './test-utils.test.js';

describe(PersonenController.name, () => {
  let harness: IntegrationTestingHarness;

  beforeEach(async () => {
    harness = await IntegrationTestingHarness.init();
    harness.login();
  });
  afterEach(async () => {
    await harness.dispose();
  });

  it('/personen (GET)', () => {
    return harness.get('/personen').expect(200).expect([]);
  });
});
