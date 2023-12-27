import {
  Deelnemer,
  Project,
  UpsertableDeelname,
  Aanmelding,
  Vakantie,
  Activiteit,
  Decimal,
  Cursus,
  CursusActiviteit,
  Plaats,
  Provincie,
} from '@rock-solid/shared';
import { ProjectenController } from './projecten.controller.js';
import { harness, factory, byId } from './test-utils.test.js';
import { expect } from 'chai';
import assert from 'assert/strict';

describe(ProjectenController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /projecten should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/projecten').expect(200);
    });
    it('POST /projecten should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/projecten').expect(403);
    });
    it('PUT /projecten/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/projecten/1').expect(403);
    });

    it('POST /projecten/:id/aanmeldingen should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/projecten/1/aanmeldingen').expect(403);
    });
    it('PUT /projecten/:id/aanmeldingen/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/projecten/1/aanmeldingen/1').expect(403);
    });
    it('PATCH /projecten/:id/aanmeldingen/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.patch('/projecten/1/aanmeldingen/1').expect(403);
    });
    it('PATCH /projecten/:id/aanmeldingen should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.patch('/projecten/1/aanmeldingen').expect(403);
    });
    it('DELETE /projecten/:id/aanmeldingen/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/projecten/1/aanmeldingen/1').expect(403);
    });

    it('PUT /projecten/:id/deelnames should be allowed for projectverantwoordelijke', async () => {
      // Arrange
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(factory.deelnemer());
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });
      harness.login({ role: 'projectverantwoordelijke' });

      // Act
      const activiteitId = project.activiteiten[0]!.id;
      const deelnames: UpsertableDeelname[] = [
        {
          aanmeldingId: aanmelding.id,
          effectieveDeelnamePerunage: 1,
          activiteitId,
        },
      ];
      await harness
        .put(
          `/projecten/${project.id}/activiteiten/${activiteitId}/deelnames`,
          deelnames,
        )
        .expect(204);
    });

    it('DELETE /projecten/:id should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/projecten/1').expect(403);
    });
  });

  describe('Eerste aanmelding', () => {
    let cursus1: Project;
    let cursus2: Project;
    let vakantie: Project;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    beforeEach(async () => {
      vakantie = await harness.createProject(
        factory.vakantie({
          activiteiten: [
            factory.activiteit({
              // earliest
              van: new Date(2010, 0, 10),
              totEnMet: new Date(2010, 0, 12),
            }),
          ],
        }),
      );
      cursus1 = await harness.createProject(
        factory.cursus({
          type: 'cursus',
          activiteiten: [
            factory.activiteit({
              van: new Date(2010, 1, 10),
              totEnMet: new Date(2010, 1, 12),
            }),
          ],
        }),
      );
      cursus2 = await harness.createProject(
        factory.cursus({
          type: 'cursus',
          activiteiten: [
            factory.activiteit({
              van: new Date(2010, 2, 10),
              totEnMet: new Date(2010, 2, 12),
            }),
          ],
        }),
      );
      deelnemer1 = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'Deelnemer1' }),
      );
      deelnemer2 = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'Deelnemer2' }),
      );
    });

    it('should be set when there are no aanmeldingen', async () => {
      const aanmelding = await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer1.id,
      });
      expect(aanmelding.deelnemer?.eersteCursus).eq(cursus1.projectnummer);
    });
    it('should be set when there is an aanmelding from a different deelnemer', async () => {
      await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer2.id,
      });
      const aanmelding = await harness.createAanmelding({
        projectId: cursus2.id,
        deelnemerId: deelnemer1.id,
      });
      expect(aanmelding.deelnemer?.eersteCursus).eq(cursus2.projectnummer);
    });

    it('should not be set when there is an earlier aanmelding', async () => {
      await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer1.id,
      });
      const aanmelding = await harness.createAanmelding({
        projectId: cursus2.id,
        deelnemerId: deelnemer1.id,
      });
      expect(aanmelding.deelnemer?.eersteCursus).eq(cursus1.projectnummer);
    });

    it('should be true when there is an earlier aanmelding, but from a different type', async () => {
      await harness.createAanmelding({
        projectId: vakantie.id,
        deelnemerId: deelnemer1.id,
      });
      const aanmelding = await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer1.id,
      });
      expect(aanmelding.deelnemer?.eersteCursus).eq(cursus1.projectnummer);
    });
  });

  describe('GET /projecten', () => {
    it('should return the correct properties', async () => {
      // Arrange
      const activiteitData = {
        van: new Date(2011, 2, 2, 20, 0, 0),
        totEnMet: new Date(2011, 2, 4, 16, 0, 0),
        vormingsuren: 20,
        begeleidingsuren: 40,
        metOvernachting: true,
      } as const satisfies Partial<CursusActiviteit>;
      const projectData = {
        projectnummer: '123',
        naam: 'Foo project',
        saldo: new Decimal(2000),
        organisatieonderdeel: 'deKei',
      } as const satisfies Partial<Cursus>;
      const project = factory.cursus({
        activiteiten: [factory.activiteit(activiteitData)],
        ...projectData,
      });
      const { id } = await harness.createProject(project);

      // Act
      const actual = await harness.getProject(id);

      // Assert
      const expectedCursus: Cursus = {
        type: 'cursus',
        begeleiders: [],
        id: 1,
        projectnummer: '123',
        naam: 'Foo project',
        jaar: 2011,
        organisatieonderdeel: 'deKei',
        activiteiten: [
          {
            id: 1,
            van: new Date(2011, 2, 2, 20, 0, 0),
            totEnMet: new Date(2011, 2, 4, 16, 0, 0),
            vormingsuren: 20,
            begeleidingsuren: 40,
            metOvernachting: true,
            aantalDeelnames: 0,
            aantalDeelnemersuren: 0,
          },
        ],
        aantalAanmeldingen: 0,
        saldo: new Decimal(2000),
        prijs: new Decimal(2000),
      };
      expect(actual).deep.eq(expectedCursus);
    });

    it('should correctly handle timezones', async () => {
      const project = await harness.createProject(
        factory.cursus({
          activiteiten: [
            factory.activiteit({
              van: new Date('2011-10-05T20:00:00.000+02:00'), // different timezones
              totEnMet: new Date('2011-10-07T16:00:00.000+01:00'), // different timezones
            }),
          ],
        }),
      );

      // Act
      const actual = await harness.getProject(project.id);

      // Assert
      expect(actual.activiteiten[0]!.van).deep.eq(
        new Date(Date.UTC(2011, 9, 5, 18, 0, 0)),
      );
      expect(actual.activiteiten[0]!.totEnMet).deep.eq(
        new Date(Date.UTC(2011, 9, 7, 15, 0, 0)),
      );
    });

    describe('filter', () => {
      let athensVakantie: Project;
      let creteVakantie: Project;
      let cookCursus: Project;
      let cleanCursus: Project;
      beforeEach(async () => {
        const jan2022 = new Date(2022, 0, 2);
        const jan2022Plus2 = new Date(2022, 0, 4);
        const jan2021 = new Date(2021, 0, 2);
        const jan2021Plus2 = new Date(2021, 0, 4);
        [athensVakantie, creteVakantie, cookCursus, cleanCursus] =
          await Promise.all([
            harness.createProject(
              factory.vakantie({ bestemming: 'Athens', land: 'Greece' }),
            ),
            harness.createProject(
              factory.vakantie({ bestemming: 'Crete', land: 'Greece' }),
            ),
            harness.createProject(
              factory.cursus({
                projectnummer: 'KJ/23/048',
                naam: 'Learning to cook',
                organisatieonderdeel: 'keiJongBuSO',
                activiteiten: [
                  factory.activiteit({ van: jan2022, totEnMet: jan2022Plus2 }),
                ],
              }),
            ),
            harness.createProject(
              factory.cursus({
                projectnummer: 'KJ/23/050',
                naam: 'Learning to clean',
                organisatieonderdeel: 'keiJongNietBuSO',
                activiteiten: [
                  factory.activiteit({ van: jan2021, totEnMet: jan2021Plus2 }),
                ],
              }),
            ),
            harness.createProject(
              factory.cursus({
                projectnummer: 'DK/23/189',
                naam: 'Other cursus',
                organisatieonderdeel: 'deKei',
              }),
            ),
            harness.createProject(factory.vakantie({ naam: 'Other vakantie' })),
          ]);
      });

      it('by titelLike', async () => {
        // Act
        const [
          learningCursussen,
          cookCursussen,
          greeceVakanties,
          athensVakanties,
          kj23Cursussen,
        ] = await Promise.all([
          harness.getAllProjecten({
            type: 'cursus',
            titelLike: 'Learning',
          }),
          harness.getAllProjecten({
            type: 'cursus',
            titelLike: 'cook',
          }),
          harness.getAllProjecten({
            type: 'vakantie',
            titelLike: 'Greece',
          }),
          harness.getAllProjecten({
            type: 'vakantie',
            titelLike: 'Athens',
          }),
          harness.getAllProjecten({ type: 'cursus', titelLike: 'KJ/23' }),
        ]);

        // Assert
        expect(learningCursussen.map(({ id }) => id).sort()).deep.eq(
          [cookCursus.id, cleanCursus.id].sort(),
        );
        expect(cookCursussen.map(({ id }) => id)).deep.eq([cookCursus.id]);
        expect(greeceVakanties.map(({ id }) => id).sort()).deep.eq(
          [athensVakantie.id, creteVakantie.id].sort(),
        );
        expect(athensVakanties.map(({ id }) => id)).deep.eq([
          athensVakantie.id,
        ]);
        expect(kj23Cursussen.sort(byId)).deep.eq(
          [cleanCursus, cookCursus].sort(byId),
        );
      });

      it('by jaar', async () => {
        // Act
        const [cursus2022, cursus2021] = await Promise.all([
          harness.getAllProjecten({
            type: 'cursus',
            jaar: 2022,
          }),
          harness.getAllProjecten({
            type: 'cursus',
            jaar: 2021,
          }),
        ]);

        // Assert
        expect(cursus2022.map(({ id }) => id)).deep.eq([cookCursus.id]);
        expect(cursus2021.map(({ id }) => id)).deep.eq([cleanCursus.id]);
      });

      it('by organisatieonderdelen', async () => {
        // Act
        const [keiJongBuSO, keiJongNietBuSO, keiJong] = await Promise.all([
          harness.getAllProjecten({
            type: 'cursus',
            organisatieonderdelen: ['keiJongBuSO'],
          }),
          harness.getAllProjecten({
            type: 'cursus',
            organisatieonderdelen: ['keiJongNietBuSO'],
          }),
          harness.getAllProjecten({
            type: 'cursus',
            organisatieonderdelen: ['keiJongBuSO', 'keiJongNietBuSO'],
          }),
        ]);

        // Assert
        expect(keiJongBuSO).deep.eq([cookCursus]);
        expect(keiJongNietBuSO).deep.eq([cleanCursus]);
        expect(keiJong.sort(byId)).deep.eq(
          [cookCursus, cleanCursus].sort(byId),
        );
      });
    });
  });

  describe('POST /projecten', () => {
    it('should create a project', async () => {
      // Arrange
      const activiteitData = {
        van: new Date(2011, 2, 2, 20, 0, 0),
        totEnMet: new Date(2011, 2, 4, 16, 0, 0),
        vormingsuren: 20,
        begeleidingsuren: 40,
        metOvernachting: true,
        verblijf: 'boot',
        vervoer: 'autocarOverdag',
      } as const satisfies Partial<Activiteit>;
      const projectData = {
        projectnummer: '123',
        naam: 'Hanover - Germany',
        type: 'vakantie',
        bestemming: 'Hanover',
        land: 'Germany',
      } as const satisfies Partial<Project>;
      const project = factory.vakantie({
        activiteiten: [factory.activiteit(activiteitData)],
        ...projectData,
      });

      // Act
      const createdProject = await harness.createProject(project);

      // Assert
      expect(createdProject).deep.eq({
        id: createdProject.id,
        ...projectData,
        aantalAanmeldingen: 0,
        begeleiders: [],
        jaar: 2011,
        activiteiten: [
          {
            ...activiteitData,
            id: createdProject.activiteiten[0]!.id,
            aantalDeelnames: 0,
            aantalDeelnemersuren: 0,
          },
        ],
      } satisfies Vakantie);
    });

    it('should add voorschot and saldo to be the total price', async () => {
      const vakantie = factory.vakantie({
        voorschot: new Decimal('41.9'),
        saldo: new Decimal('0.1'),
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.type, 'vakantie');
      expect(project.prijs).deep.eq(new Decimal('42'));
    });

    it('should base naam on `bestemming - land` for vakanties', async () => {
      const vakantie = factory.vakantie({
        bestemming: 'Beach',
        land: 'Spain',
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.naam, 'Beach - Spain');
    });
    it('should not base the naam on `bestemming - land` for cursus', async () => {
      const vakantie = factory.cursus({
        naam: 'Mijn cursus',
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.naam, 'Mijn cursus');
    });
  });

  describe('PATCH /projecten/:id/aanmeldingen', () => {
    let project: Project;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    let aanmelding1: Aanmelding;
    let aanmelding2: Aanmelding;
    beforeEach(async () => {
      // Arrange
      [project, deelnemer1, deelnemer2] = await Promise.all([
        harness.createProject(factory.cursus()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      [aanmelding1, aanmelding2] = await Promise.all([
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer1.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer2.id,
        }),
      ]);
    });

    it('should be able to update rekeninguittreksel nummers', async () => {
      // Act
      const aanmeldingen = await harness.partialUpdateAanmeldingen(project.id, [
        { id: aanmelding1.id, rekeninguittrekselNummer: '123' },
        { id: aanmelding2.id, rekeninguittrekselNummer: '456' },
      ]);

      // Assert
      const expectedAanmeldingen: Aanmelding[] = [
        { ...aanmelding1, rekeninguittrekselNummer: '123' },
        { ...aanmelding2, rekeninguittrekselNummer: '456' },
      ];
      expect(aanmeldingen).deep.eq(expectedAanmeldingen);
    });

    it('should be able to clear the rekeninguittreksel nummers', async () => {
      // Arrange
      await harness.partialUpdateAanmeldingen(project.id, [
        { id: aanmelding1.id, rekeninguittrekselNummer: '123' },
        { id: aanmelding2.id, rekeninguittrekselNummer: '456' },
      ]);

      // Act
      const aanmeldingen = await harness.partialUpdateAanmeldingen(project.id, [
        { id: aanmelding1.id, rekeninguittrekselNummer: '123' },
        { id: aanmelding2.id, rekeninguittrekselNummer: undefined },
      ]);

      // Assert
      const { rekeninguittrekselNummer, ...aanmelding2Data } = aanmelding2;
      const expectedAanmeldingen: Aanmelding[] = [
        { ...aanmelding1, rekeninguittrekselNummer: '123' },
        aanmelding2Data,
      ];
      expect(aanmeldingen).deep.eq(expectedAanmeldingen);
    });

    it('should store "woonsituatie", "werksituatie", "geslacht" en "woonplaats" in the aanmelding', async () => {
      // Arrange
      const luik = await harness.db.insertPlaats(
        factory.plaats({
          gemeente: 'Luik',
          postcode: '4000',
          provincie: Provincie.Luik,
        }),
      );
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({
          woonsituatie: 'residentieleWoonondersteuning',
          werksituatie: 'werkzoekend',
          verblijfadres: factory.adres({ plaats: luik }),
          geslacht: 'x',
        }),
      );
      await harness.createDeelnemer(deelnemer);

      // Act
      const { id: actualAanmeldingId } = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      // Assert
      deelnemer.woonsituatie = 'onbekend';
      deelnemer.werksituatie = 'onbekend';
      deelnemer.verblijfadres = undefined;
      deelnemer.geslacht = 'onbekend';
      await harness.updateDeelnemer(deelnemer);
      const actualAanmelding = (await harness.getAanmeldingen(project.id)).find(
        ({ id }) => id === actualAanmeldingId,
      );
      const expectedAanmelding: Partial<Aanmelding> = {
        woonsituatie: 'residentieleWoonondersteuning',
        werksituatie: 'werkzoekend',
        geslacht: 'x',
        plaats: luik,
      };
      expect(actualAanmelding).deep.include(expectedAanmelding);
    });
  });

  describe('PUT /projecten/:id/aanmeldingen/:id', () => {
    let plaats: Plaats;
    let project: Project;
    let deelnemer: Deelnemer;

    beforeEach(async () => {
      [project, deelnemer, plaats] = await Promise.all([
        harness.createProject(factory.cursus()),
        harness.createDeelnemer(
          factory.deelnemer({
            werksituatie: 'onbekend',
            woonsituatie: 'onbekend',
            geslacht: 'onbekend',
            domicilieadres: undefined,
            verblijfadres: undefined,
          }),
        ),
        harness.db.insertPlaats(
          factory.plaats({
            gemeente: 'Luik',
            postcode: '4000',
            provincie: Provincie.Luik,
          }),
        ),
      ]);
    });

    it('should be able to update "werksituatie", "woonsituatie", "geslacht" and "plaats"', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      // Act
      aanmelding.werksituatie = 'arbeidstrajectbegeleiding';
      aanmelding.woonsituatie = 'residentieleWoonondersteuning';
      aanmelding.geslacht = 'x';
      aanmelding.plaats = plaats;
      const actualAanmelding = await harness.updateAanmelding(aanmelding);

      // Assert
      const expectedAanmelding: Partial<Aanmelding> = {
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        plaats,
      };
      expect(actualAanmelding).deep.include(expectedAanmelding);
    });
  });

  describe('DELETE /projecten/:id', () => {
    it('should delete the project and all related aanmeldingen and deelnames', async () => {
      // Arrange
      const [project, deelnemer1, deelnemer2] = await Promise.all([
        harness.createProject(
          factory.cursus({
            activiteiten: [factory.activiteit(), factory.activiteit()],
          }),
        ),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      const [aanmelding1, aanmelding2] = await Promise.all([
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer1.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer2.id,
        }),
      ]);
      await Promise.all([
        harness.updateDeelnames(project.id, project.activiteiten[0]!.id, [
          {
            activiteitId: project.activiteiten[0]!.id,
            aanmeldingId: aanmelding1.id,
            effectieveDeelnamePerunage: 1,
          },
        ]),
        harness.updateDeelnames(project.id, project.activiteiten[1]!.id, [
          {
            activiteitId: project.activiteiten[1]!.id,
            aanmeldingId: aanmelding2.id,
            effectieveDeelnamePerunage: 0.5,
          },
        ]),
        harness.updateDeelnames(project.id, project.activiteiten[1]!.id, []),
      ]);

      // Act
      await harness.delete(`/projecten/${project.id}`).expect(204);

      // Assert
      await harness.get(`/projecten/${project.id}`).expect(404);
    });
  });

  describe('DELETE /projecten/:id/aanmeldingen/:id', () => {
    it('should delete the aanmelding and deelnames', async () => {
      // Arrange
      const [project, deelnemer] = await Promise.all([
        harness.createProject(
          factory.cursus({
            activiteiten: [factory.activiteit(), factory.activiteit()],
          }),
        ),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });
      await Promise.all([
        harness.updateDeelnames(project.id, project.activiteiten[0]!.id, [
          {
            activiteitId: project.activiteiten[0]!.id,
            aanmeldingId: aanmelding.id,
            effectieveDeelnamePerunage: 1,
          },
        ]),
        harness.updateDeelnames(project.id, project.activiteiten[1]!.id, [
          {
            activiteitId: project.activiteiten[1]!.id,
            aanmeldingId: aanmelding.id,
            effectieveDeelnamePerunage: 0.5,
          },
        ]),
      ]);

      // Act
      await harness
        .delete(`/projecten/${project.id}/aanmeldingen/${aanmelding.id}`)
        .expect(204);

      // Assert
      const actualProject = await harness.getProject(project.id);
      expect(actualProject.aantalAanmeldingen).eq(0);
    });
  });
});
