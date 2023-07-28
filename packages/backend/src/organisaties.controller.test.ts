import { OrganisatiesController } from './organisaties.controller.js';
import { harness } from './test-utils.test.js';

describe(OrganisatiesController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /organisaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/organisaties').expect(200);
    });
    it('POST /organisaties should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/organisaties').expect(403);
    });
    it('PUT /organisaties/1 should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/organisaties/1').expect(403);
    });
  });
});
