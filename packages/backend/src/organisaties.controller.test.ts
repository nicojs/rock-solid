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

  describe('GET /organisaties', () => {
    let acme: Organisatie;
    let disney: Organisatie;
    beforeEach(async () => {
      [acme, disney] = await Promise.all([
        harness.createOrganisatie({
          naam: 'Acme',
          contacten: [
            factory.organisatieContact({
              terAttentieVan: 'Hans',
              foldervoorkeuren: [
                { folder: 'deKeiCursussen', communicatie: 'post' },
              ],
            }),
            factory.organisatieContact({
              terAttentieVan: 'Piet',
              foldervoorkeuren: [
                { folder: 'keiJongBuso', communicatie: 'email' },
              ],
            }),
          ],
        }),
        harness.createOrganisatie({
          naam: 'Disney',
          contacten: [
            factory.organisatieContact({
              terAttentieVan: 'Mickey',
              foldervoorkeuren: [
                {
                  folder: 'deKeiWintervakanties',
                  communicatie: 'postEnEmail',
                },
                {
                  folder: 'keiJongBuso',
                  communicatie: 'postEnEmail',
                },
              ],
            }),
          ],
        }),
      ]);
    });

    describe('filters', () => {
      it('should be able to filter naam', async () => {
        // Act
        const [acmeOrgs, disneyOrgs] = await Promise.all([
          harness.getAllOrganisaties({ naam: 'acme' }),
          harness.getAllOrganisaties({ naam: 'disney' }),
        ]);

        // Assert
        expect(acmeOrgs.map(({ id }) => id)).deep.eq([acme.id]);
        expect(disneyOrgs.map(({ id }) => id)).deep.eq([disney.id]);
      });

      it('should be able to filter on foldervoorkeur', async () => {
        // Act
        const [deKeiCursussenOrgs, keiJongBusoOrgs] = await Promise.all([
          harness.getAllOrganisaties({ folders: ['deKeiCursussen'] }),
          harness.getAllOrganisaties({ folders: ['keiJongBuso'] }),
        ]);

        // Assert
        expect(deKeiCursussenOrgs.map(({ id }) => id)).deep.eq([acme.id]);
        expect(deKeiCursussenOrgs[0]?.contacten).lengthOf(1);
        expect(deKeiCursussenOrgs[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(keiJongBusoOrgs.map(({ id }) => id).sort()).deep.eq(
          [disney.id, acme.id].sort(),
        );
        const acmeOrg = keiJongBusoOrgs.find((org) => org.id === acme.id)!;
        const disneyOrg = keiJongBusoOrgs.find((org) => org.id === disney.id)!;
        expect(
          acmeOrg.contacten.map(({ terAttentieVan }) => terAttentieVan),
        ).deep.eq(['Piet']);
        expect(
          disneyOrg.contacten.map(({ terAttentieVan }) => terAttentieVan),
        ).deep.eq(['Mickey']);
      });
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
