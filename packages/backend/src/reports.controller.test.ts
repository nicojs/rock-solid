import { ProjectReport } from '@rock-solid/shared';
import { ReportsController } from './reports.controller.js';
import { IntegrationTestingHarness, factory } from './test-utils.test.js';
import { expect } from 'chai';

describe(ReportsController.name, () => {
  let harness: IntegrationTestingHarness;

  beforeEach(async () => {
    harness = await IntegrationTestingHarness.init();
    harness.login();
  });

  afterEach(async () => {
    await harness.dispose();
  });

  describe('grouping', () => {
    it('should support grouping by year', async () => {
      await arrangeCursussenTestSet();
      const report = await harness.getReport(
        'reports/projecten/aanmeldingen',
        'jaar',
      );
      const expectedReport: ProjectReport = [
        { key: '2021', total: 2 },
        { key: '2020', total: 1 },
      ];
      expect(report).deep.eq(expectedReport);
    });

    it('should support grouping by year and project', async () => {
      await arrangeCursussenTestSet();
      const report = await harness.getReport(
        'reports/projecten/aanmeldingen',
        'jaar',
        'project',
      );
      const expectedReport: ProjectReport = [
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
          'reports/projecten/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true },
        );
        const expectedReport: ProjectReport = [
          { key: '2021', total: 2 },
          { key: '2020', total: 1 },
          { key: '2019', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });
      it('should be able to filter only cursussen', async () => {
        const report = await harness.getReport(
          'reports/projecten/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true, type: 'cursus' },
        );
        const expectedReport: ProjectReport = [
          { key: '2021', total: 1 },
          { key: '2020', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });
      it('should be able to filter only vakanties', async () => {
        const report = await harness.getReport(
          'reports/projecten/aanmeldingen',
          'jaar',
          undefined,
          { enkelEersteAanmeldingen: true, type: 'vakantie' },
        );
        const expectedReport: ProjectReport = [
          { key: '2021', total: 1 },
          { key: '2019', total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
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
    await harness.createAanmelding({
      deelnemerId: deelnemerA.id,
      projectId: projectA.id,
    });
    await harness.createAanmelding({
      deelnemerId: deelnemerA.id,
      projectId: projectB.id,
    });
    await harness.createAanmelding({
      deelnemerId: deelnemerB.id,
      projectId: projectA.id,
    });
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
