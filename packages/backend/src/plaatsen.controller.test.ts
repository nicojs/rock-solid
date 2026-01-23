import { expect } from 'chai';
import { PlaatsenController } from './plaatsen.controller.js';
import { byId, harness } from './test-utils.test.js';
import { Plaats } from '@rock-solid/shared';

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
    it('POST /plaatsen should be forbidden for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/plaatsen', []).expect(403);
    });
    it('POST /plaatsen should be allowed for admin', async () => {
      harness.login({ role: 'admin' });
      await harness.post('/plaatsen', []).expect(201);
    });
  });

  describe('POST /plaatsen', () => {
    it('should create plaatsen', async () => {
      // Arrange
      const plaatsen = [
        { deelgemeente: 'A', gemeente: 'B', postcode: '1000' },
        { deelgemeente: 'C', gemeente: 'D', postcode: '2000' },
      ];

      // Act
      await harness.post('/plaatsen', plaatsen).expect(201);

      // Assert
      const resp = await harness.getPlaatsen();
      expect(resp.body).to.have.length(3);
      const expectedPlaatsen: Plaats[] = [
        harness.seedPlaats,
        {
          id: 2,
          deelgemeente: 'A',
          gemeente: 'B',
          postcode: '1000',
          provincie: 'Brussels Hoofdstedelijk Gewest',
        },
        {
          id: 3,
          deelgemeente: 'C',
          gemeente: 'D',
          postcode: '2000',
          provincie: 'Antwerpen',
        },
      ];
      expect(resp.body.sort(byId)).to.deep.equal(expectedPlaatsen);
    });

    it('should update existing plaatsen', async () => {
      // Arrange
      const plaatsen = [
        {
          deelgemeente: 'Deelgemeente',
          gemeente: 'Gemeente',
          postcode: '1234',
        },
      ];
      await harness.post('/plaatsen', plaatsen).expect(201);
      const updatedPlaatsen = [
        {
          deelgemeente: 'Deelgemeente',
          gemeente: 'New Gemeente',
          postcode: '1234',
        },
      ];

      // Act
      await harness.post('/plaatsen', updatedPlaatsen).expect(201);

      // Assert
      const resp = await harness.getPlaatsen();
      expect(resp.body).to.have.length(2);
      const expectedPlaatsen: Plaats[] = [
        harness.seedPlaats,
        {
          id: 2,
          deelgemeente: 'Deelgemeente',
          gemeente: 'New Gemeente',
          postcode: '1234',
          provincie: 'Brussels Hoofdstedelijk Gewest',
        },
      ];
      expect(resp.body.sort(byId)).to.deep.equal(expectedPlaatsen);
    });
  });
});
