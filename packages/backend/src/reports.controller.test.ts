import { Report } from '@rock-solid/shared';
import { ReportsController } from './reports.controller.js';
import { harness, factory } from './test-utils.test.js';
import { expect } from 'chai';

describe(ReportsController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });

  it('should be allowed for projectverantwoordelijke', async () => {
    harness.login({ role: 'projectverantwoordelijke' });
    await harness.getReport('reports/aanmeldingen/aanmeldingen', 'jaar');
  });

  describe('grouping', () => {
    it('should support grouping by year', async () => {
      await arrangeCursussenTestSet();
      const report = await harness.getReport(
        'reports/aanmeldingen/aanmeldingen',
        'jaar',
      );
      const expectedReport: Report = [
        { key: '2021', total: 2 },
        { key: '2020', total: 1 },
      ];
      expect(report).deep.eq(expectedReport);
    });

    it('should support grouping by year and project', async () => {
      await arrangeCursussenTestSet();
      const report = await harness.getReport(
        'reports/aanmeldingen/aanmeldingen',
        'jaar',
        'project',
      );
      const expectedReport: Report = [
        {
          key: '2021',
          total: 2,
          rows: [
            {
              count: 2,
              key: '001 A',
            },
          ],
        },
        {
          key: '2020',
          total: 1,
          rows: [
            {
              count: 1,
              key: '002 B',
            },
          ],
        },
      ];
      expect(report).deep.eq(expectedReport);
    });
  });

  describe('filter', () => {
    describe('enkelEersteAanmeldingen', () => {
      beforeEach(async () => {
        await arrangeCursussenTestSet();
        await arrangeVakantiesTestSet();
      });

      it('should only count eerste aanmeldingen', async () => {
        const report = await harness.getReport(
          'reports/aanmeldingen/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true },
        );
        const expectedReport: Report = [
          { key: '2021', total: 2 },
          { key: '2020', total: 1 },
          { key: '2019', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });
      it('should be able to filter only cursussen', async () => {
        const report = await harness.getReport(
          'reports/aanmeldingen/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true, type: 'cursus' },
        );
        const expectedReport: Report = [
          { key: '2021', total: 1 },
          { key: '2020', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });
      it('should be able to filter only vakanties', async () => {
        const report = await harness.getReport(
          'reports/aanmeldingen/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true, type: 'vakantie' },
        );
        const expectedReport: Report = [
          { key: '2021', total: 1 },
          { key: '2019', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });
    });

    describe('aanmeldingsstatus', () => {
      beforeEach(async () => {
        await arrangeCursussenTestSet();
      });

      it('should be able to filter on aanmeldingsstatus', async () => {
        const [aangemeldReport, bevestigdReport] = await Promise.all([
          harness.getReport(
            'reports/aanmeldingen/aanmeldingen',
            'jaar',
            undefined,
            { aanmeldingsstatus: 'Aangemeld' },
          ),
          harness.getReport(
            'reports/aanmeldingen/aanmeldingen',
            'jaar',
            undefined,
            { aanmeldingsstatus: 'Bevestigd' },
          ),
        ]);
        const expectedAangemeldReport: Report = [
          { key: '2021', total: 1 },
          { key: '2020', total: 1 },
        ];
        const expectedBevestigdReport: Report = [{ key: '2021', total: 1 }];
        expect(aangemeldReport).deep.eq(expectedAangemeldReport);
        expect(bevestigdReport).deep.eq(expectedBevestigdReport);
      });
    });
  });

  async function arrangeCursussenTestSet() {
    const [deelnemerA, deelnemerB] = await Promise.all([
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'A' })),
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'B' })),
    ]);
    const [projectA, projectB] = await Promise.all([
      harness.createProject(
        factory.project({
          naam: 'A',
          projectnummer: '001',
          activiteiten: [factory.activiteit(new Date(2021, 1, 1))],
        }),
      ),
      harness.createProject(
        factory.project({
          projectnummer: '002',
          naam: 'B',
          activiteiten: [factory.activiteit(new Date(2020, 1, 1))],
        }),
      ),
    ]);

    const aanmelding1 = await harness.createAanmelding({
      deelnemerId: deelnemerA.id,
      projectId: projectA.id,
    });
    const aanmelding2 = await harness.createAanmelding({
      deelnemerId: deelnemerA.id,
      projectId: projectB.id,
    });
    const aanmelding3 = await harness.createAanmelding({
      deelnemerId: deelnemerB.id,
      projectId: projectA.id,
    });
    await harness.partialUpdateAanmeldingen(projectA.id, [
      { id: aanmelding1.id, status: 'Aangemeld' },
      { id: aanmelding2.id, status: 'Aangemeld' },
      { id: aanmelding3.id, status: 'Bevestigd' },
    ]);
  }
  async function arrangeVakantiesTestSet() {
    const [deelnemerC, deelnemerD] = await Promise.all([
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'C' })),
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'D' })),
    ]);
    const [projectC, projectD] = await Promise.all([
      harness.createProject(
        factory.project({
          naam: 'C',
          projectnummer: '003',
          type: 'vakantie',
          activiteiten: [factory.activiteit(new Date(2021, 1, 1))],
        }),
      ),
      harness.createProject(
        factory.project({
          projectnummer: '004',
          naam: 'D',
          type: 'vakantie',
          activiteiten: [factory.activiteit(new Date(2019, 1, 1))],
        }),
      ),
    ]);
    await harness.createAanmelding({
      deelnemerId: deelnemerC.id,
      projectId: projectC.id,
    });
    await harness.createAanmelding({
      deelnemerId: deelnemerC.id,
      projectId: projectD.id,
    });
    await harness.createAanmelding({
      deelnemerId: deelnemerD.id,
      projectId: projectC.id,
    });
  }
});
