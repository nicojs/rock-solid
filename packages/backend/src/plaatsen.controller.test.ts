import { PlaatsenController } from './plaatsen.controller.js';
import { harness } from './test-utils.test.js';

describe(PlaatsenController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /plaatsen should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/plaatsen').expect(200);
    });
  });
});
