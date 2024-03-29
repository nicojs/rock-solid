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

  describe('aanmeldingen report', () => {
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

      it('should support grouping on "werksituatie" when the deelnemer is deleted', async () => {
        const { deelnemerA } = await arrangeCursussenTestSet();
        await harness.deleteDeelnemer(deelnemerA.id);
        const report = await harness.getReport(
          'reports/aanmeldingen/aanmeldingen',
          'werksituatie',
        );
        const expectedReport: Report = [
          { key: 'arbeidszorg', total: 2 },
          { total: 1 },
        ];
        expect(report).deep.eq(expectedReport);
      });

      it('should support grouping on "woonsituatie" when the deelnemer is deleted', async () => {
        const { deelnemerA } = await arrangeCursussenTestSet();
        await harness.deleteDeelnemer(deelnemerA.id);
        const report = await harness.getReport(
          'reports/aanmeldingen/aanmeldingen',
          'woonsituatie',
        );
        const expectedReport: Report = [
          { key: 'residentieleWoonondersteuning', total: 2 },
          { total: 1 },
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
  });
  describe('activiteiten report', () => {
    it('should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.getReport('reports/activiteiten/vormingsuren', 'jaar');
    });

    describe('grouping', () => {
      it('should support grouping by year', async () => {
        await arrangeCursussenTestSet();
        await arrangeVakantiesTestSet();
        const report = await harness.getReport(
          'reports/activiteiten/vormingsuren',
          'jaar',
        );
        const expectedReport: Report = [
          { key: '2021', total: 80 },
          { key: '2020', total: 10 },
          { key: '2019', total: 90 },
        ];
        expect(report).deep.eq(expectedReport);
      });

      it('should support grouping by year and project', async () => {
        await arrangeCursussenTestSet();
        const report = await harness.getReport(
          'reports/activiteiten/vormingsuren',
          'jaar',
          'project',
        );
        const expectedReport: Report = [
          {
            key: '2021',
            total: 20,
            rows: [
              {
                count: 20,
                key: '001 A',
              },
            ],
          },
          {
            key: '2020',
            total: 10,
            rows: [
              {
                count: 10,
                key: '002 B',
              },
            ],
          },
        ];
        expect(report).deep.eq(expectedReport);
      });
    });
  });

  async function arrangeCursussenTestSet() {
    const [deelnemerA, deelnemerB] = await Promise.all([
      harness.createDeelnemer(
        factory.deelnemer({
          woonsituatie: 'residentieleWoonondersteuning',
          werksituatie: 'arbeidszorg',
          geslacht: 'x',
          achternaam: 'A',
        }),
      ),
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'B' })),
    ]);
    const [projectA, projectB] = await Promise.all([
      harness.createProject(
        factory.cursus({
          naam: 'A',
          projectnummer: '001',
          activiteiten: [
            factory.activiteit({ van: new Date(2021, 1, 1), vormingsuren: 20 }),
          ],
        }),
      ),
      harness.createProject(
        factory.cursus({
          projectnummer: '002',
          naam: 'B',
          activiteiten: [
            factory.activiteit({ van: new Date(2020, 1, 1), vormingsuren: 10 }),
          ],
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
    await harness.patchAanmeldingen(projectA.id, [
      { id: aanmelding1.id, status: 'Aangemeld' },
      { id: aanmelding2.id, status: 'Aangemeld' },
      { id: aanmelding3.id, status: 'Bevestigd' },
    ]);
    return { deelnemerA };
  }
  async function arrangeVakantiesTestSet() {
    const [deelnemerC, deelnemerD] = await Promise.all([
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'C' })),
      harness.createDeelnemer(factory.deelnemer({ achternaam: 'D' })),
    ]);
    const [projectC, projectD] = await Promise.all([
      harness.createProject(
        factory.vakantie({
          naam: 'C',
          projectnummer: '003',
          activiteiten: [
            factory.activiteit({ van: new Date(2021, 1, 1), vormingsuren: 60 }),
          ],
        }),
      ),
      harness.createProject(
        factory.vakantie({
          projectnummer: '004',
          naam: 'D',
          activiteiten: [
            factory.activiteit({ van: new Date(2019, 1, 1), vormingsuren: 90 }),
          ],
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
