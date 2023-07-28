import {
  Deelnemer,
  Project,
  UpsertableDeelname,
  Aanmelding,
} from '@rock-solid/shared';
import { ProjectenController } from './projecten.controller.js';
import { harness, factory } from './test-utils.test.js';
import { expect } from 'chai';

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

    it('PUT /projecten/:id/deelnames should be allowed for projectverantwoordelijke', async () => {
      // Arrange
      const project = await harness.createProject(factory.project());
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
  });

  describe('Eerste aanmelding', () => {
    let cursus1: Project;
    let cursus2: Project;
    let vakantie: Project;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    beforeEach(async () => {
      vakantie = await harness.createProject(
        factory.project({
          type: 'vakantie',
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
        factory.project({
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
        factory.project({
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

  describe('PATCH /projecten/:id/aanmeldingen', () => {
    let project: Project;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    let aanmelding1: Aanmelding;
    let aanmelding2: Aanmelding;
    beforeEach(async () => {
      // Arrange
      [project, deelnemer1, deelnemer2] = await Promise.all([
        harness.createProject(factory.project()),
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
  });
});
