import { expect } from 'chai';
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

  describe('GET /plaatsen', () => {
    it('should return seed plaats', async () => {
      // Act
      const resp = await harness.getPlaatsen();

      // Assert
      expect(resp.body).to.have.length(1);
      expect(resp.body[0]).to.deep.equal(harness.seedPlaats);
    });

    it('should return plaatsen with land field', async () => {
      // Arrange
      await harness.insertPlaats({
        deelgemeente: 'Brussel',
        gemeente: 'Brussel',
        postcode: '1000',
        provincie: 'Brussels Hoofdstedelijk Gewest',
        land: 'België',
      });

      // Act
      const resp = await harness.getPlaatsen({ search: 'Brussel' });

      // Assert
      expect(resp.body).to.have.length(1);
      expect(resp.body[0]!.land).to.equal('België');
    });
  });
});
