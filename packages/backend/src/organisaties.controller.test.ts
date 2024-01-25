import { Organisatie, OrganisatieContact } from '@rock-solid/shared';
import { OrganisatiesController } from './organisaties.controller.js';
import { factory, harness } from './test-utils.test.js';
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
        plaats: harness.db.seedPlaats,
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
            soortOpmerking: 'Begeleid maar is toch ambulant',
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
        soortOpmerking: 'Begeleid maar is toch ambulant',
      };
      expect(actualOrganisatie).deep.equal(expectedOrganisatie);
    });
  });

  describe('GET /organisaties', () => {
    let acme: Organisatie;
    let disney: Organisatie;
    let nintendo: Organisatie;
    beforeEach(async () => {
      const antwerpen = await harness.db.insertPlaats(
        factory.plaats({
          postcode: '2000',
          deelgemeente: 'Antwerpen',
          provincie: 'Antwerpen',
        }),
      );
      const gent = await harness.db.insertPlaats(
        factory.plaats({
          postcode: '9000',
          deelgemeente: 'Gent',
          provincie: 'West-Vlaanderen',
        }),
      );
      [acme, disney, nintendo] = await Promise.all([
        harness.createOrganisatie({
          naam: 'Acme',
          contacten: [
            factory.organisatieContact({
              terAttentieVan: 'Hans',
              adres: {
                straatnaam: 'AcmeStreet',
                huisnummer: '1',
                plaats: antwerpen,
              },
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
                  folder: 'deKeiWintervakantie',
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
        harness.createOrganisatie({
          naam: 'Nintendo',
          contacten: [
            factory.organisatieContact({
              terAttentieVan: 'Miyamoto',
              adres: {
                straatnaam: 'NintendoStreet',
                huisnummer: '1',
                plaats: gent,
              },
            }),
          ],
        }),
      ]);
    });

    describe('filters', () => {
      it('by naam', async () => {
        // Act
        const [acmeOrgs, disneyOrgs] = await Promise.all([
          harness.getAllOrganisaties({ naam: 'acme' }),
          harness.getAllOrganisaties({ naam: 'disney' }),
        ]);

        // Assert
        expect(acmeOrgs.map(({ id }) => id)).deep.eq([acme.id]);
        expect(disneyOrgs.map(({ id }) => id)).deep.eq([disney.id]);
      });

      it('by foldervoorkeur', async () => {
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

      it('by metAdres', async () => {
        // Act
        const [metAdresOrgs, zonderAdresOrgs, noFilter] = await Promise.all([
          harness.getAllOrganisaties({ metAdres: true }),
          harness.getAllOrganisaties({ metAdres: false }),
          harness.getAllOrganisaties({ metAdres: false }),
        ]);

        // Assert
        expect(metAdresOrgs.map(({ id }) => id)).deep.eq([
          acme.id,
          nintendo.id,
        ]);
        expect(metAdresOrgs[0]?.contacten).lengthOf(1);
        expect(metAdresOrgs[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(metAdresOrgs[1]?.contacten[0]?.terAttentieVan).eq('Miyamoto');
        expect(zonderAdresOrgs.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(noFilter.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(zonderAdresOrgs[0]?.contacten).lengthOf(2);
        expect(zonderAdresOrgs[1]?.contacten).lengthOf(1);
      });

      it('by provincie', async () => {
        // Act
        const [antwerpenOrgs, gentOrgs, noFilter] = await Promise.all([
          harness.getAllOrganisaties({ provincie: 'Antwerpen' }),
          harness.getAllOrganisaties({
            provincie: 'West-Vlaanderen',
          }),
          harness.getAllOrganisaties({}),
        ]);

        // Assert
        expect(antwerpenOrgs.map(({ id }) => id)).deep.eq([acme.id]);
        expect(antwerpenOrgs[0]?.contacten).lengthOf(1);
        expect(antwerpenOrgs[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(gentOrgs.map(({ id }) => id)).deep.eq([nintendo.id]);
        expect(gentOrgs[0]?.contacten).lengthOf(1);
        expect(gentOrgs[0]?.contacten[0]?.terAttentieVan).eq('Miyamoto');
        expect(noFilter.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
      });
    });
  });

  describe('PUT /organisaties/:id', () => {
    let disney: Organisatie;
    beforeEach(async () => {
      disney = await harness.createOrganisatie({
        naam: 'Disney',
        contacten: [
          factory.organisatieContact({
            terAttentieVan: 'Mickey',
            adres: {
              straatnaam: 'Mousestreet',
              huisnummer: '1',
              plaats: harness.db.seedPlaats,
            },
            foldervoorkeuren: [
              {
                folder: 'deKeiWintervakantie',
                communicatie: 'postEnEmail',
              },
              {
                folder: 'keiJongBuso',
                communicatie: 'postEnEmail',
              },
            ],
          }),
          factory.organisatieContact({ terAttentieVan: 'Minie' }),
        ],
      });
    });

    it('should delete the adres of a contact', async () => {
      // Act
      await harness.updateOrganisatie({
        ...disney,
        contacten: disney.contacten.map((contact) => ({
          ...contact,
          adres: undefined,
        })),
      });

      // Assert
      const updatedDisney = await harness.getOrganisatie(disney.id);
      expect(updatedDisney.contacten[0]!.adres).undefined;
      expect(updatedDisney.contacten[1]!.adres).undefined;
    });

    it('should be able to delete nullable fields', async () => {
      // Arrange
      const contact = disney.contacten[0]!;
      await harness.updateOrganisatie({
        ...disney,
        contacten: [
          {
            ...contact,
            afdeling: 'afd',
            emailadres: 'e@mail.com',
            telefoonnummer: 'tel',
            terAttentieVan: 'tav',
          },
        ],
        soortOpmerking: 'soort opm',
        website: 'example.com',
      });

      // Arrange
      await harness.updateOrganisatie({
        ...disney,
        contacten: [
          {
            ...contact,
            adres: undefined,
            afdeling: undefined,
            emailadres: undefined,
            telefoonnummer: undefined,
            terAttentieVan: undefined,
            foldervoorkeuren: [],
          },
        ],
        soortOpmerking: undefined,
        website: undefined,
      });

      // Assert
      const actual = await harness.getOrganisatie(disney.id);
      expect(actual.contacten).lengthOf(1);
      const expectedContact: OrganisatieContact = {
        id: contact.id,
        terAttentieVan: '',
        foldervoorkeuren: [],
      };
      expect(actual.contacten[0]).deep.eq(expectedContact);
      expect(actual.soortOpmerking).eq(undefined);
      expect(actual.website).eq(undefined);
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

    it('should delete the organisatiesoort', async () => {
      const org = await harness.createOrganisatie({
        soorten: ['AmbulanteWoonondersteuning'],
      });
      await harness.delete(`/organisaties/${org.id}`).expect(204);
      await harness.get(`/organisaties/${org.id}`).expect(404);
    });

    it('should result in a 404 when the organisatie does not exist', async () => {
      await harness.delete(`/organisaties/999`).expect(404);
    });
  });
});
