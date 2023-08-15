import { Organisatie } from '@rock-solid/shared';
import { OrganisatiesController } from './organisaties.controller.js';
import { factory, harness, onbekendePlaats } from './test-utils.test.js';
import { expect } from 'chai';

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
    it('PUT /organisaties/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/organisaties/1').expect(403);
    });
    it('DELETE /organisaties/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/organisaties/1').expect(403);
    });
  });

  describe('POST /organisaties', () => {
    it('should create the organisatie and contacts', async () => {
      const adres = {
        straatnaam: 'Foostraat',
        huisnummer: '1',
        plaats: onbekendePlaats,
      };
      const response = await harness
        .post(
          '/organisaties',
          factory.organisatie({
            naam: 'Foo Corp',
            soorten: [
              'AmbulanteWoonondersteuning',
              'BegeleidWerkOfVrijwilligerswerk',
            ],
            contacten: [
              {
                terAttentieVan: 'Foo',
                adres,
                foldervoorkeuren: [
                  {
                    folder: 'deKeiCursussen',
                    communicatie: 'email',
                  },
                ],
              },
            ],
          }),
        )
        .expect(201);
      const actualOrganisatie: Organisatie = response.body;
      const expectedOrganisatie: Organisatie = {
        id: actualOrganisatie.id,
        contacten: [
          {
            id: actualOrganisatie.contacten[0]!.id,
            foldervoorkeuren: [
              {
                folder: 'deKeiCursussen',
                communicatie: 'email',
              },
            ],
            adres: {
              ...adres,
              id: actualOrganisatie.contacten[0]!.adres!.id,
            },
            terAttentieVan: 'Foo',
          },
        ],
        naam: 'Foo Corp',
        soorten: [
          'AmbulanteWoonondersteuning',
          'BegeleidWerkOfVrijwilligerswerk',
        ],
      };
      expect(actualOrganisatie).deep.equal(expectedOrganisatie);
    });
  });
  describe('DELETE /organisaties/:id', () => {
    it('should delete the organisatie and organisatie contacten', async () => {
      const org = await harness.createOrganisatie({
        contacten: [
          factory.organisatieContact({ terAttentieVan: 'Hans' }),
          factory.organisatieContact({ terAttentieVan: 'Piet' }),
        ],
      });
      await harness.delete(`/organisaties/${org.id}`).expect(204);
      await harness.get(`/organisaties/${org.id}`).expect(404);
    });

    it('should result in a 404 when the organisatie does not exist', async () => {
      await harness.delete(`/organisaties/999`).expect(404);
    });
  });
});
