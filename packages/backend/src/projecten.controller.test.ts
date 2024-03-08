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
  Deelname,
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

  async function arrangeAanmelding() {
    const [{ id: projectId }, { id: deelnemerId }] = await Promise.all([
      harness.createProject(factory.cursus()),
      harness.createDeelnemer(factory.deelnemer()),
    ]);
    const aanmelding = await harness.createAanmelding({
      projectId,
      deelnemerId,
    });
    return aanmelding;
  }

  describe('auth', () => {
    it('GET /projecten should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/projecten').expect(200);
    });
    it('POST /projecten should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/projecten').expect(403);
    });
    it('PUT /projecten/:id should be allowed for projectverantwoordelijke', async () => {
      const cursus = await harness.createProject(factory.cursus());
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put(`/projecten/${cursus.id}`, cursus).expect(200);
    });
    it('DELETE /projecten/:id should not be allowed for projectverantwoordelijke', async () => {
      const cursus = await harness.createProject(factory.cursus());
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete(`/projecten/${cursus.id}`).expect(403);
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

    it('POST /projecten/:id/aanmeldingen should be allowed for projectverantwoordelijke', async () => {
      const [{ id: projectId }, { id: deelnemerId }] = await Promise.all([
        harness.createProject(factory.cursus()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.createAanmelding({ projectId, deelnemerId });
    });

    it('PUT /projecten/:id/aanmeldingen/:id should be allowed for projectverantwoordelijke', async () => {
      const aanmelding = await arrangeAanmelding();
      harness.login({ role: 'projectverantwoordelijke' });
      aanmelding.status = 'Bevestigd';
      await harness.updateAanmelding(aanmelding);
    });

    it('PATCH /projecten/:id/aanmeldingen/:id should be allowed for projectverantwoordelijke', async () => {
      const aanmelding = await arrangeAanmelding();
      harness.login({ role: 'projectverantwoordelijke' });
      aanmelding.status = 'Bevestigd';
      await harness.patchAanmelding(aanmelding.projectId, {
        id: aanmelding.id,
        status: 'Bevestigd',
      });
    });

    it('DELETE /projecten/:id/aanmeldingen/:id should NOT be allowed for projectverantwoordelijke', async () => {
      const aanmelding = await arrangeAanmelding();
      harness.login({ role: 'projectverantwoordelijke' });
      await harness
        .delete(
          `/projecten/${aanmelding.projectId}/aanmeldingen/${aanmelding.id}`,
        )
        .expect(403);
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

    it('should be the first cursus when there is an earlier aanmelding, but from a different type', async () => {
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

    it('should not be the first cursus when there is an early cursus aanmelding for a cursus without activiteiten (#201)', async () => {
      // Arrange
      await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer1.id,
      });
      await harness.db.client.activiteit.deleteMany({
        where: { projectId: cursus1.id },
      });

      // Act
      const aanmelding = await harness.createAanmelding({
        projectId: cursus2.id,
        deelnemerId: deelnemer1.id,
      });

      // Assert
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
        id,
        projectnummer: '123',
        naam: 'Foo project',
        jaar: 2011,
        organisatieonderdeel: 'deKei',
        activiteiten: [
          {
            id: actual.activiteiten[0]!.id,
            van: new Date(2011, 2, 2, 20, 0, 0),
            totEnMet: new Date(2011, 2, 4, 16, 0, 0),
            vormingsuren: 20,
            begeleidingsuren: 40,
            metOvernachting: true,
            aantalDeelnames: 0,
            aantalDeelnemersuren: 0,
            isCompleted: true,
          },
        ],
        aantalInschrijvingen: 0,
        saldo: new Decimal(2000),
        prijs: new Decimal(2000),
      };
      expect(actual).deep.eq(expectedCursus);
    });

    it('should count aantal aanmeldingen with status "bevestigd" or "aangemeld" as inschrijvingen', async () => {
      // Arrange
      const [
        cursus,
        deelnemerAangemeld,
        deelnemerBevestigd,
        deelnemerGeannuleerd,
        deelnemerWachtrij,
      ] = await Promise.all([
        harness.createProject(factory.cursus()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      const [, bevestigd, wachtrij, geannuleerd] = await Promise.all([
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemerAangemeld.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemerBevestigd.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemerWachtrij.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemerGeannuleerd.id,
        }),
      ]);
      await Promise.all([
        harness.patchAanmelding(cursus.id, {
          id: bevestigd.id,
          status: 'Bevestigd',
        }),
        harness.patchAanmelding(cursus.id, {
          id: wachtrij.id,
          status: 'OpWachtlijst',
        }),
        harness.patchAanmelding(cursus.id, {
          id: geannuleerd.id,
          status: 'Geannuleerd',
        }),
      ]);

      // Act
      const actual = await harness.getProject(cursus.id);

      // Assert
      expect(actual.aantalInschrijvingen).eq(2);
    });

    it('should only count the deelnames with effectieve deelname', async () => {
      // Arrange
      const [cursus, deelnemer1, deelnemer2] = await Promise.all([
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
          projectId: cursus.id,
          deelnemerId: deelnemer1.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemer2.id,
        }),
      ]);
      await Promise.all([
        harness.patchAanmelding(cursus.id, {
          id: aanmelding1.id,
          status: 'Bevestigd',
        }),
        harness.patchAanmelding(cursus.id, {
          id: aanmelding2.id,
          status: 'OpWachtlijst',
        }),
      ]);
      await Promise.all([
        harness.updateDeelnames(cursus.id, cursus.activiteiten[0]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 1 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 1 },
        ]),
        harness.updateDeelnames(cursus.id, cursus.activiteiten[1]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 0.1 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0 }, // no deelname
        ]),
      ]);

      // Act
      const actual = await harness.getProject(cursus.id);

      // Assert
      const actualAantalDeelnames1 = actual.activiteiten.find(
        ({ id }) => id === cursus.activiteiten[0]?.id,
      )?.aantalDeelnames;
      const actualAantalDeelnames2 = actual.activiteiten.find(
        ({ id }) => id === cursus.activiteiten[1]?.id,
      )?.aantalDeelnames;
      expect(actualAantalDeelnames1).eq(2);
      expect(actualAantalDeelnames2).eq(1);
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

    it('should mark an activiteit as "completed" if all aanmeldingen have deelnames', async () => {
      // Arrange
      const [cursus, deelnemer1, deelnemer2, deelnemer3] = await Promise.all([
        harness.createProject(
          factory.cursus({
            activiteiten: [factory.activiteit(), factory.activiteit()],
          }),
        ),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      const [aanmelding1, aanmelding2, aanmelding3] = await Promise.all([
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemer1.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemer2.id,
        }),
        harness.createAanmelding({
          projectId: cursus.id,
          deelnemerId: deelnemer3.id,
        }),
      ]);
      await Promise.all([
        harness.patchAanmelding(cursus.id, {
          id: aanmelding1.id,
          status: 'Bevestigd',
        }),
        harness.patchAanmelding(cursus.id, {
          id: aanmelding2.id,
          status: 'Bevestigd',
        }),
        harness.patchAanmelding(cursus.id, {
          id: aanmelding3.id,
          status: 'Bevestigd',
        }),
      ]);
      await Promise.all([
        harness.updateDeelnames(cursus.id, cursus.activiteiten[0]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 1 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0.1 }, // went home sick
          { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 0 }, // no-show
        ]),
        harness.updateDeelnames(cursus.id, cursus.activiteiten[1]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 0.1 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0 }, // no deelname
          // missing deelname 3
        ]),
      ]);

      // Act
      const actual = await harness.getProject(cursus.id);

      // Assert
      const actualActiviteit1 = actual.activiteiten.find(
        (ac) => ac.id === cursus.activiteiten[0]!.id,
      );
      const actualActiviteit2 = actual.activiteiten.find(
        (ac) => ac.id === cursus.activiteiten[1]!.id,
      );
      expect(actualActiviteit1?.isCompleted).true;
      expect(actualActiviteit2?.isCompleted).false;
    });

    it('should mark an activiteit as "completed" it is in the past without aanmeldingen', async () => {
      // Arrange
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
      );
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const cursus = await harness.createProject(
        factory.cursus({
          activiteiten: [
            factory.activiteit({ van: yesterday, totEnMet: today }),
            factory.activiteit({ van: today, totEnMet: tomorrow }),
          ],
        }),
      );

      // Act
      const actual = await harness.getProject(cursus.id);

      // Assert
      const actualActiviteit1 = actual.activiteiten.find(
        (ac) => ac.id === cursus.activiteiten[0]!.id,
      );
      const actualActiviteit2 = actual.activiteiten.find(
        (ac) => ac.id === cursus.activiteiten[1]!.id,
      );
      expect(actualActiviteit1?.isCompleted).true;
      expect(actualActiviteit2?.isCompleted).false;
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
        seizoen: 'winter',
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
        aantalInschrijvingen: 0,
        begeleiders: [],
        jaar: 2011,
        seizoen: 'winter',
        activiteiten: [
          {
            ...activiteitData,
            id: createdProject.activiteiten[0]!.id,
            aantalDeelnames: 0,
            aantalDeelnemersuren: 0,
            isCompleted: true,
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

    it('should determine the jaar based on the first activiteit', async () => {
      const vakantie = factory.vakantie({
        activiteiten: [
          factory.activiteit({
            van: new Date(2011, 2, 2, 20, 0, 0),
            totEnMet: new Date(2011, 2, 4, 16, 0, 0),
          }),
        ],
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.jaar, 2011);
    });

    it('should determine the jaar based on the projectnummer if there are no activiteiten', async () => {
      const vakantie = factory.vakantie({
        projectnummer: 'KJ/11/123',
        activiteiten: [],
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.jaar, 2011);
    });

    it('should fallback the jaar to this year if there are no activiteiten and no (valid) projectnummer', async () => {
      const vakantie = factory.vakantie({
        projectnummer: 'KJ/not-valid/1234',
        activiteiten: [],
      });
      const project = await harness.createProject(vakantie);
      assert.equal(project.jaar, new Date().getFullYear());
    });

    it("should connect the cursuslocatie to it's activiteiten", async () => {
      // Arrange
      const [loc, loc2] = await Promise.all([
        harness.createLocatie(factory.locatie({ naam: 'locatie 1' })),
        harness.createLocatie(factory.locatie({ naam: 'locatie 2' })),
      ]);

      // Act
      const actualProject = await harness.createProject(
        factory.cursus({
          activiteiten: [
            factory.activiteit({ locatie: loc }),
            factory.activiteit({ locatie: loc2 }),
            factory.activiteit({ locatie: undefined }),
          ],
        }),
      );

      // Assert
      expect(
        actualProject.activiteiten.map((a) => a.locatie).sort(byId),
      ).deep.eq([loc, loc2, undefined].sort(byId));
    });
  });

  describe('PUT /projecten/:id', () => {
    it('should be able to delete nullable fields', async () => {
      // Arrange
      const project = await harness.createProject(
        factory.cursus({
          saldo: new Decimal(2000),
          prijs: new Decimal(2000),
          activiteiten: [
            factory.activiteit({ vormingsuren: 23, begeleidingsuren: 50 }),
          ],
        }),
      );

      // Act
      const actual = await harness.updateProject({
        ...project,
        saldo: undefined,
        prijs: undefined,
        activiteiten: project.activiteiten.map((act) => ({
          ...act,
          vormingsuren: undefined,
          begeleidingsuren: undefined,
        })),
      });

      // Assert
      const { activiteiten, prijs, saldo, voorschot, ...expectedProject } =
        project;
      const { vormingsuren, begeleidingsuren, ...expectedActiviteit } =
        activiteiten[0]!;
      expect(actual).deep.eq({
        ...expectedProject,
        activiteiten: [expectedActiviteit],
      });
    });

    it('should connect a new cursuslocatie', async () => {
      // Arrange
      const [loc1, loc2] = await Promise.all([
        harness.createLocatie(factory.locatie({ naam: 'locatie 1' })),
        harness.createLocatie(factory.locatie({ naam: 'locatie 2' })),
      ]);
      const project = await harness.createProject(
        factory.cursus({
          activiteiten: [
            factory.activiteit({ locatie: loc1 }),
            factory.activiteit({ locatie: loc2 }),
          ],
        }),
      );

      // Act
      const actualProject = await harness.updateProject({
        ...project,
        activiteiten: project.activiteiten.map((a) => ({
          ...a,
          locatie: loc2,
        })),
      });

      // Assert
      expect(
        actualProject.activiteiten.map((a) => a.locatie).sort(byId),
      ).deep.eq([loc2, loc2].sort(byId));
    });

    it('should disconnect a missing cursuslocatie', async () => {
      // Arrange
      const loc = await harness.createLocatie(
        factory.locatie({ naam: 'locatie 1' }),
      );
      const project = await harness.createProject(
        factory.cursus({
          activiteiten: [factory.activiteit({ locatie: loc })],
        }),
      );

      // Act
      const actualProject = await harness.updateProject({
        ...project,
        activiteiten: project.activiteiten.map((a) => ({
          ...a,
          locatie: undefined,
        })),
      });

      // Assert
      expect(actualProject.activiteiten[0]!.locatie).undefined;
    });

    it('should connect a locatie to a new activiteit', async () => {
      // Arrange
      const loc = await harness.createLocatie(
        factory.locatie({ naam: 'locatie 1' }),
      );
      const project = await harness.createProject(
        factory.cursus({
          activiteiten: [factory.activiteit({ locatie: undefined })],
        }),
      );

      // Act
      const actualProject = await harness.updateProject({
        ...project,
        activiteiten: [
          ...project.activiteiten,
          factory.activiteit({ locatie: loc }),
        ],
      });

      // Assert
      expect(actualProject.activiteiten.sort(byId).at(-1)!.locatie).deep.eq(
        loc,
      );
    });
  });

  describe('GET /projecten/:id/aanmeldingen', () => {
    let project: Project;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    let deelnemer3: Deelnemer;
    let aanmelding1: Aanmelding;
    let aanmelding2: Aanmelding;
    let aanmelding3: Aanmelding;
    let activiteit1: Activiteit;
    let activiteit2: Activiteit;
    beforeEach(async () => {
      // Arrange
      [project, deelnemer1, deelnemer2, deelnemer3] = await Promise.all([
        harness.createProject(
          factory.cursus({
            activiteiten: [factory.activiteit(), factory.activiteit()],
          }),
        ),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      [activiteit1, activiteit2] = project.activiteiten as [
        Activiteit,
        Activiteit,
      ];
      [aanmelding1, aanmelding2, aanmelding3] = await Promise.all([
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer1.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer2.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer3.id,
        }),
      ]);
    });

    it('should get all deelnames', async () => {
      // Arrange
      await Promise.all([
        harness.updateDeelnames(project.id, project.activiteiten[0]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 1 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0.1 },
          { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 0 },
        ]),
        harness.updateDeelnames(project.id, project.activiteiten[1]!.id, [
          { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 0.2 },
          { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0.1 },
        ]),
      ]);

      // Act
      const actualAanmeldingen = await harness.getAanmeldingen(project.id);

      // Assert
      expect(actualAanmeldingen).lengthOf(3);
      const actualAanmelding1 = actualAanmeldingen.find(
        ({ id }) => id === aanmelding1.id,
      )!;
      const actualAanmelding2 = actualAanmeldingen.find(
        ({ id }) => id === aanmelding2.id,
      )!;
      const actualAanmelding3 = actualAanmeldingen.find(
        ({ id }) => id === aanmelding3.id,
      )!;
      const expectedDeelnames1: Deelname[] = [
        {
          aanmeldingId: aanmelding1.id,
          activiteitId: activiteit1.id,
          effectieveDeelnamePerunage: 1,
          id: actualAanmelding1.deelnames.find(
            (deelname) => deelname.activiteitId === activiteit1.id,
          )!.id,
        },
        {
          aanmeldingId: aanmelding1.id,
          activiteitId: activiteit2.id,
          effectieveDeelnamePerunage: 0.2,
          id: actualAanmelding1.deelnames.find(
            (deelname) => deelname.activiteitId === activiteit2.id,
          )!.id,
        },
      ];
      const expectedDeelnames2: Deelname[] = [
        {
          aanmeldingId: aanmelding2.id,
          activiteitId: activiteit1.id,
          effectieveDeelnamePerunage: 0.1,
          id: actualAanmelding2.deelnames.find(
            (deelname) => deelname.activiteitId === activiteit1.id,
          )!.id,
        },
        {
          aanmeldingId: aanmelding2.id,
          activiteitId: activiteit2.id,
          effectieveDeelnamePerunage: 0.1,
          id: actualAanmelding2.deelnames.find(
            (deelname) => deelname.activiteitId === activiteit2.id,
          )!.id,
        },
      ];
      const expectedDeelnames3: Deelname[] = [
        {
          aanmeldingId: aanmelding3.id,
          activiteitId: activiteit1.id,
          effectieveDeelnamePerunage: 0,
          id: actualAanmelding3.deelnames.find(
            (deelname) => deelname.activiteitId === activiteit1.id,
          )!.id,
        },
      ];
      expect(actualAanmelding1.deelnames.sort(byId)).deep.eq(
        expectedDeelnames1.sort(byId),
      );
      expect(actualAanmelding2.deelnames.sort(byId)).deep.eq(
        expectedDeelnames2.sort(byId),
      );
      expect(actualAanmelding3.deelnames.sort(byId)).deep.eq(
        expectedDeelnames3.sort(byId),
      );
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
      const aanmeldingen = await harness.patchAanmeldingen(project.id, [
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
      await harness.patchAanmeldingen(project.id, [
        { id: aanmelding1.id, rekeninguittrekselNummer: '123' },
        { id: aanmelding2.id, rekeninguittrekselNummer: '456' },
      ]);

      // Act
      const aanmeldingen = await harness.patchAanmeldingen(project.id, [
        { id: aanmelding1.id, rekeninguittrekselNummer: undefined }, // Should be ignored
        { id: aanmelding2.id, rekeninguittrekselNummer: null }, // Should clear the rekeninguittreksel nummer
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
          provincie: 'Luik',
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
      deelnemer.woonsituatie = undefined;
      deelnemer.werksituatie = undefined;
      deelnemer.verblijfadres = undefined;
      deelnemer.geslacht = undefined;
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

    it('should not delete "status", "werksituatie", "woonsituatie", "geslacht", "plaats" and "opmerking" when not provided', async () => {
      // Arrange
      const deelnemer = await harness.createDeelnemer(factory.deelnemer());
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        opmerking: 'Foo',
      });

      // Act
      const actualAanmeldingen = await harness.patchAanmeldingen(project.id, [
        aanmelding,
      ]);

      // Assert
      const actualAanmelding = actualAanmeldingen[0]!;
      expect(actualAanmelding.werksituatie).eq('arbeidstrajectbegeleiding');
      expect(actualAanmelding.woonsituatie).eq('residentieleWoonondersteuning');
      expect(actualAanmelding.geslacht).eq('x');
      expect(actualAanmelding.opmerking).eq('Foo');
    });

    it('should also delete existing deelnames when the status is not "Bevestigd"', async () => {
      // Arrange
      const [deelnemer3, deelnemer4, deelnemer5] = await Promise.all([
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(factory.deelnemer()),
      ]);
      const [aanmelding3, aanmelding4, aanmelding5] = await Promise.all([
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer3.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer4.id,
        }),
        harness.createAanmelding({
          projectId: project.id,
          deelnemerId: deelnemer5.id,
        }),
      ]);
      await harness.updateDeelnames(project.id, project.activiteiten[0]!.id, [
        { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 1 },
        { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0 },
        { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 0 },
        { aanmeldingId: aanmelding4.id, effectieveDeelnamePerunage: 1 },
        { aanmeldingId: aanmelding5.id, effectieveDeelnamePerunage: 1 },
      ]);

      // Act
      const [bevestigd, aangemeld, geannuleerd, wachtlijst, und] =
        await Promise.all([
          harness.patchAanmelding(project.id, {
            id: aanmelding1.id,
            status: 'Bevestigd',
          }),
          harness.patchAanmelding(project.id, {
            id: aanmelding2.id,
            status: 'Aangemeld',
          }),
          harness.patchAanmelding(project.id, {
            id: aanmelding3.id,
            status: 'Geannuleerd',
          }),
          harness.patchAanmelding(project.id, {
            id: aanmelding4.id,
            status: 'OpWachtlijst',
          }),
          harness.patchAanmelding(project.id, {
            id: aanmelding5.id,
            status: undefined,
          }),
        ]);

      // Assert
      expect(bevestigd.deelnames).length(1);
      expect(aangemeld.deelnames).length(0);
      expect(geannuleerd.deelnames).length(0);
      expect(wachtlijst.deelnames).length(0);
      expect(und.deelnames).length(1);
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
            domicilieadres: undefined,
            verblijfadres: undefined,
          }),
        ),
        harness.db.insertPlaats(
          factory.plaats({
            gemeente: 'Luik',
            postcode: '4000',
            provincie: 'Luik',
          }),
        ),
      ]);
    });

    it('should be able to update "werksituatie", "woonsituatie", "geslacht", "plaats", "status", and "opmerking"', async () => {
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
      aanmelding.status = 'Bevestigd';
      aanmelding.opmerking = 'Foo';
      const actualAanmelding = await harness.updateAanmelding(aanmelding);

      // Assert
      const expectedAanmelding: Partial<Aanmelding> = {
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        plaats,
        status: 'Bevestigd',
        opmerking: 'Foo',
      };
      expect(actualAanmelding).deep.include(expectedAanmelding);
    });

    it('should be able to delete "werksituatie", "woonsituatie", "geslacht", "plaats", "opmerking" en "rekeningnummer"', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });
      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        plaats: plaats,
        opmerking: 'Foo',
        rekeninguittrekselNummer: '123',
      });

      // Act
      const actualAanmelding = await harness.updateAanmelding(aanmelding);

      // Assert
      expect(actualAanmelding.werksituatie).undefined;
      expect(actualAanmelding.woonsituatie).undefined;
      expect(actualAanmelding.geslacht).undefined;
      expect(actualAanmelding.rekeninguittrekselNummer).undefined;
      expect(actualAanmelding.plaats).undefined;
      expect(actualAanmelding.opmerking).undefined;
    });

    it('should override deelnemer "werksituatie", "woonsituatie" and "geslacht" when "overrideDeelnemerFields": true', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      // Act
      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        overrideDeelnemerFields: true,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      const expectedDeelnemer: Partial<Deelnemer> = {
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
      };
      expect(actualDeelnemer).deep.include(expectedDeelnemer);
    });

    it('should not override deelnemer "werksituatie", "woonsituatie" and "geslacht" when "overrideDeelnemerFields": false', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      // Act
      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        overrideDeelnemerFields: false,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.werksituatie).undefined;
      expect(actualDeelnemer.woonsituatie).undefined;
      expect(actualDeelnemer.geslacht).undefined;
    });

    it('should not override deelnemer "werksituatie", "woonsituatie" and "geslacht" when "overrideDeelnemerFields": undefined', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });

      // Act
      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.werksituatie).undefined;
      expect(actualDeelnemer.woonsituatie).undefined;
      expect(actualDeelnemer.geslacht).undefined;
    });

    it('should not override deelnemer "werksituatie", "woonsituatie" and "geslacht" when "overrideDeelnemerFields": true but the deelnemer does not exist anymore', async () => {
      // Arrange
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        deelnemerId: deelnemer.id,
      });
      await harness.deleteDeelnemer(deelnemer.id);

      // Act
      await harness.updateAanmelding({
        ...aanmelding,
        werksituatie: 'arbeidstrajectbegeleiding',
        woonsituatie: 'residentieleWoonondersteuning',
        geslacht: 'x',
        overrideDeelnemerFields: true,
      });

      // Assert
      await harness.get(`/personen/${deelnemer.id}`).expect(404);
    });

    it('should also delete existing deelnames when the status is not "Bevestigd"', async () => {
      // Arrange
      const [deelnemer1, deelnemer2, deelnemer3, deelnemer4] =
        await Promise.all([
          harness.createDeelnemer(factory.deelnemer()),
          harness.createDeelnemer(factory.deelnemer()),
          harness.createDeelnemer(factory.deelnemer()),
          harness.createDeelnemer(factory.deelnemer()),
        ]);
      const [aanmelding1, aanmelding2, aanmelding3, aanmelding4] =
        await Promise.all([
          harness.createAanmelding({
            projectId: project.id,
            deelnemerId: deelnemer1.id,
          }),
          harness.createAanmelding({
            projectId: project.id,
            deelnemerId: deelnemer2.id,
          }),
          harness.createAanmelding({
            projectId: project.id,
            deelnemerId: deelnemer3.id,
          }),
          harness.createAanmelding({
            projectId: project.id,
            deelnemerId: deelnemer4.id,
          }),
        ]);
      await harness.updateDeelnames(project.id, project.activiteiten[0]!.id, [
        { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 1 },
        { aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 0 },
        { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 0 },
        { aanmeldingId: aanmelding4.id, effectieveDeelnamePerunage: 1 },
      ]);

      // Act
      const [bevestigd, aangemeld, geannuleerd, wachtlijst] = await Promise.all(
        [
          harness.updateAanmelding({ ...aanmelding1, status: 'Bevestigd' }),
          harness.updateAanmelding({ ...aanmelding2, status: 'Aangemeld' }),
          harness.updateAanmelding({ ...aanmelding3, status: 'Geannuleerd' }),
          harness.updateAanmelding({ ...aanmelding4, status: 'OpWachtlijst' }),
        ],
      );

      // Assert
      expect(bevestigd.deelnames).length(1);
      expect(aangemeld.deelnames).length(0);
      expect(geannuleerd.deelnames).length(0);
      expect(wachtlijst.deelnames).length(0);
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
      expect(actualProject.aantalInschrijvingen).eq(0);
    });
  });
});
