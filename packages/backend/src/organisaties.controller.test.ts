import { Organisatie, OrganisatieContact } from '@rock-solid/shared';
import { OrganisatiesController } from './organisaties.controller.js';
import { byId, factory, harness } from './test-utils.test.js';
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
    // See https://github.com/nicojs/rock-solid/issues/239
    it('should return organisaties without contacten', async () => {
      const org = await harness.createOrganisatie(
        factory.organisatie({ contacten: [] }),
      );
      const actual = await harness.getAllOrganisaties({});
      expect(actual.body).deep.eq([org]);
    });

    describe('filters', () => {
      let acme: Organisatie;
      let disney: Organisatie;
      let nintendo: Organisatie;
      beforeEach(async () => {
        const [antwerpen, gent] = await Promise.all([
          harness.db.insertPlaats(
            factory.plaats({
              postcode: '2000',
              deelgemeente: 'Antwerpen',
              provincie: 'Antwerpen',
            }),
          ),
          harness.db.insertPlaats(
            factory.plaats({
              postcode: '9000',
              deelgemeente: 'Gent',
              provincie: 'West-Vlaanderen',
            }),
          ),
        ]);
        [acme, disney, nintendo] = await Promise.all([
          harness.createOrganisatie({
            naam: 'Acme',
            soorten: [
              'AmbulanteWoonondersteuning',
              'BegeleidWerkOfVrijwilligerswerk',
              'CAW',
            ],
            contacten: [
              factory.organisatieContact({
                terAttentieVan: 'Hans',
                emailadres: 'hans@acme.com',
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
                emailadres: 'piet@acme.com',
                foldervoorkeuren: [
                  { folder: 'keiJongBuso', communicatie: 'email' },
                ],
              }),
            ],
          }),
          harness.createOrganisatie({
            naam: 'Disney',
            soorten: ['AmbulanteWoonondersteuning'],
            contacten: [
              factory.organisatieContact({
                terAttentieVan: 'Mickey',
                emailadres: 'mickey@disney.com',
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
                emailadres: 'miyamoto@nintendo.com',
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
      it('by naam', async () => {
        // Act
        const [acmeOrgsResult, disneyOrgsResult] = await Promise.all([
          harness.getAllOrganisaties({ naam: 'acme' }),
          harness.getAllOrganisaties({ naam: 'disney' }),
        ]);

        // Assert
        expect(acmeOrgsResult.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(disneyOrgsResult.body.map(({ id }) => id)).deep.eq([disney.id]);
        expect(acmeOrgsResult.totalCount).eq(1);
        expect(disneyOrgsResult.totalCount).eq(1);
      });

      it('by foldervoorkeur', async () => {
        // Act
        const [deKeiCursussenOrgs, keiJongBusoOrgs, deKeiWintervakantieOrgs] =
          await Promise.all([
            harness.getAllOrganisaties({ folders: ['deKeiCursussen'] }),
            harness.getAllOrganisaties({ folders: ['keiJongBuso'] }),
            harness.getAllOrganisaties({
              folders: ['deKeiWintervakantie', 'keiJongBuso'],
            }),
          ]);

        // Assert
        expect(deKeiCursussenOrgs.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(deKeiCursussenOrgs.body[0]?.contacten).lengthOf(1);
        expect(deKeiCursussenOrgs.body[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(keiJongBusoOrgs.body.map(({ id }) => id).sort()).deep.eq(
          [disney.id, acme.id].sort(),
        );
        const acmeOrg = keiJongBusoOrgs.body.find((org) => org.id === acme.id)!;
        const disneyOrg = keiJongBusoOrgs.body.find((org) => org.id === disney.id)!;
        expect(
          acmeOrg.contacten.map(({ terAttentieVan }) => terAttentieVan),
        ).deep.eq(['Piet']);
        expect(
          disneyOrg.contacten.map(({ terAttentieVan }) => terAttentieVan),
        ).deep.eq(['Mickey']);
        expect(deKeiWintervakantieOrgs.body.sort(byId).map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
        ].sort());
        expect(deKeiCursussenOrgs.totalCount).eq(1);
        expect(keiJongBusoOrgs.totalCount).eq(2);
        expect(deKeiWintervakantieOrgs.totalCount).eq(2);
      });

      it('by metAdres', async () => {
        // Act
        const [metAdresOrgs, zonderAdresOrgs, noFilter] = await Promise.all([
          harness.getAllOrganisaties({ metAdres: true }),
          harness.getAllOrganisaties({ metAdres: false }),
          harness.getAllOrganisaties({ metAdres: false }),
        ]);

        // Assert
        expect(metAdresOrgs.body.map(({ id }) => id)).deep.eq([
          acme.id,
          nintendo.id,
        ]);
        expect(metAdresOrgs.body[0]?.contacten).lengthOf(1);
        expect(metAdresOrgs.body[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(metAdresOrgs.body[1]?.contacten[0]?.terAttentieVan).eq('Miyamoto');
        expect(zonderAdresOrgs.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(noFilter.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(zonderAdresOrgs.body[0]?.contacten).lengthOf(2);
        expect(zonderAdresOrgs.body[1]?.contacten).lengthOf(1);
        expect(noFilter.totalCount).eq(3);
        expect(metAdresOrgs.totalCount).eq(2);
        expect(zonderAdresOrgs.totalCount).eq(3);
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
        expect(antwerpenOrgs.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(antwerpenOrgs.body[0]?.contacten).lengthOf(1);
        expect(antwerpenOrgs.body[0]?.contacten[0]?.terAttentieVan).eq('Hans');
        expect(gentOrgs.body.map(({ id }) => id)).deep.eq([nintendo.id]);
        expect(gentOrgs.body[0]?.contacten).lengthOf(1);
        expect(gentOrgs.body[0]?.contacten[0]?.terAttentieVan).eq('Miyamoto');
        expect(noFilter.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(noFilter.totalCount).eq(3);
        expect(antwerpenOrgs.totalCount).eq(1);
        expect(gentOrgs.totalCount).eq(1);
      });

      it('by soorten', async () => {
        // Act
        const [
          ambulanteWoonondersteuningOrgs,
          cawOrgs,
          cawClb,
          geenSoorten,
          noFilter,
        ] = await Promise.all([
          harness.getAllOrganisaties({
            soorten: ['AmbulanteWoonondersteuning'],
          }),
          harness.getAllOrganisaties({ soorten: ['CAW'] }),
          harness.getAllOrganisaties({ soorten: ['CAW', 'CLB'] }),
          harness.getAllOrganisaties({ soorten: [] }),
          harness.getAllOrganisaties({ soorten: undefined }),
        ]);

        // Assert
        expect(ambulanteWoonondersteuningOrgs.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
        ]);
        expect(ambulanteWoonondersteuningOrgs.body[0]?.contacten).lengthOf(2);
        expect(cawOrgs.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(cawClb.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(geenSoorten.body.map(({ id }) => id)).deep.eq([
          acme.id, // same as noFilter
          disney.id,
          nintendo.id,
        ]);
        expect(noFilter.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
        expect(ambulanteWoonondersteuningOrgs.totalCount).eq(2);
        expect(cawOrgs.totalCount).eq(1);
        expect(cawClb.totalCount).eq(1);
        expect(geenSoorten.totalCount).eq(3);
        expect(noFilter.totalCount).eq(3);
      });

      it('by emailadres', async () => {
        // Act
        const [hansOrgs, hansCaseInsensitiveOrgs, noFilter] = await Promise.all(
          [
            harness.getAllOrganisaties({ emailadres: 'hans' }),
            harness.getAllOrganisaties({ emailadres: 'HANS' }),
            harness.getAllOrganisaties({}),
          ],
        );

        // Assert
        expect(hansOrgs.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(hansOrgs.body[0]?.contacten).lengthOf(1);
        expect(hansCaseInsensitiveOrgs.body.map(({ id }) => id)).deep.eq([acme.id]);
        expect(hansCaseInsensitiveOrgs.body[0]?.contacten).lengthOf(1);
        expect(noFilter.body.map(({ id }) => id)).deep.eq([
          acme.id,
          disney.id,
          nintendo.id,
        ]);
      });

      // it('should return the total count in the header based on filters', async () => {
      //   // Act
      //   const [naamFilter, soortenFilter, foldersFilter] = await Promise.all([
      //     harness.countOrganisaties({ naam: 'acme' }),
      //     harness.countOrganisaties({
      //       soorten: [
      //         'AmbulanteWoonondersteuning',
      //         'BegeleidWerkOfVrijwilligerswerk',
      //       ],
      //     }),
      //     harness.countOrganisaties({
      //       folders: ['keiJongBuso', 'deKeiWintervakantie'],
      //     }),
      //   ]);
  
      //   // Assert
      //   expect(naamFilter).eq(1);
      //   expect(soortenFilter).eq(2);
      //   expect(foldersFilter).eq(2);
      // });
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
