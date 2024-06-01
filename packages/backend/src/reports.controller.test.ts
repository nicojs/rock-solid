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

    describe('report types', () => {
      async function arrangeDeelnamenTestSet() {
        const [deelnemerA, deelnemerB, project1, project2] = await Promise.all([
          harness.createDeelnemer(factory.deelnemer({ achternaam: 'A' })),
          harness.createDeelnemer(factory.deelnemer({ achternaam: 'B' })),
          harness.createProject(
            factory.cursus({
              activiteiten: [
                factory.activiteit({
                  van: new Date(2024, 1, 1),
                  vormingsuren: 20,
                }),
                factory.activiteit({
                  van: new Date(2024, 2, 1),
                  vormingsuren: 20,
                }),
              ],
            }),
          ),
          harness.createProject(
            factory.cursus({
              activiteiten: [
                factory.activiteit({
                  van: new Date(2024, 1, 1),
                  vormingsuren: 10,
                }),
              ],
            }),
          ),
          harness.createProject(
            // control project
            factory.cursus({
              activiteiten: [
                factory.activiteit({
                  van: new Date(2024, 1, 1),
                  vormingsuren: 99,
                }),
              ],
            }),
          ),
        ]);
        const [aanmeldingA1, aanmeldingB1, aanmeldingA2, aanmeldingB2] =
          await Promise.all([
            harness.createAanmelding({
              deelnemerId: deelnemerA.id,
              projectId: project1.id,
            }),
            harness.createAanmelding({
              deelnemerId: deelnemerB.id,
              projectId: project1.id,
            }),
            harness.createAanmelding({
              deelnemerId: deelnemerA.id,
              projectId: project2.id,
            }),
            harness.createAanmelding({
              deelnemerId: deelnemerB.id,
              projectId: project2.id,
            }),
          ]);
        await harness.updateDeelnames(
          project1.id,
          project1.activiteiten[0]!.id,
          [
            { aanmeldingId: aanmeldingA1.id, effectieveDeelnamePerunage: 0 }, // 20 * 0 = 0 deelnemersuren
            { aanmeldingId: aanmeldingB1.id, effectieveDeelnamePerunage: 0.8 }, // 20 * .8 = 16 deelnemersuren
          ],
        );
        await harness.updateDeelnames(
          project2.id,
          project2.activiteiten[0]!.id,
          [
            { aanmeldingId: aanmeldingA2.id, effectieveDeelnamePerunage: 1 }, // 10 * 1 = 10 deelnemersuren
            { aanmeldingId: aanmeldingB2.id, effectieveDeelnamePerunage: 1 }, // 10 * 1 = 10 deelnemersuren
          ],
        );
        return {
          deelnemerA,
          deelnemerB,
          project1,
          project2,
          aanmeldingA1,
          aanmeldingB1,
          aanmeldingA2,
          aanmeldingB2,
        };
      }

      it('should support "deelnemersuren"', async () => {
        await arrangeCursussenTestSet();
        const report = await harness.getReport(
          'reports/aanmeldingen/deelnemersuren',
          'jaar',
        );
        const expectedReport: Report = [
          { key: '2021', total: 40 },
          { key: '2020', total: 10 },
        ];
        expect(report).deep.eq(expectedReport);
      });

      it('should not count 0 "deelnemersuren"', async () => {
        await arrangeDeelnamenTestSet();

        const report = await harness.getReport(
          'reports/aanmeldingen/deelnemersuren',
          'jaar',
        );
        const expectedReport: Report = [{ key: '2024', total: 36 }];
        expect(report).deep.eq(expectedReport);
      });

      it('should support "deelnemersurenPrognose"', async () => {
        await arrangeDeelnamenTestSet();

        const report = await harness.getReport(
          'reports/aanmeldingen/deelnemersurenPrognose',
          'jaar',
        );
        // 36 actual, 40 planned
        const expectedReport: Report = [{ key: '2024', total: 76 }];
        expect(report).deep.eq(expectedReport);
      });

      it('should not count wachtlijst or geannuleerde aanmeldingen towards the prognose for "deelnemersurenPrognose"', async () => {
        const { project1 } = await arrangeDeelnamenTestSet();
        const [deelnemerC, deelnemerD] = await Promise.all([
          harness.createDeelnemer(factory.deelnemer({ achternaam: 'C' })),
          harness.createDeelnemer(factory.deelnemer({ achternaam: 'D' })),
        ]);
        const [aanmeldingC, aanmeldingD] = await Promise.all([
          harness.createAanmelding({
            deelnemerId: deelnemerC.id,
            projectId: project1.id,
          }),
          harness.createAanmelding({
            deelnemerId: deelnemerD.id,
            projectId: project1.id,
          }),
        ]);
        await harness.updateAanmelding({
          ...aanmeldingC,
          status: 'OpWachtlijst',
        });
        await harness.updateAanmelding({
          ...aanmeldingD,
          status: 'Geannuleerd',
        });

        const report = await harness.getReport(
          'reports/aanmeldingen/deelnemersurenPrognose',
          'jaar',
        );
        // 36 actual, 40 planned
        const expectedReport: Report = [{ key: '2024', total: 76 }];
        expect(report).deep.eq(expectedReport);
      });
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
          { key: '2021', total: 100 },
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
            total: 40,
            rows: [
              {
                count: 40,
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
    const [project2021, project2020] = await Promise.all([
      harness.createProject(
        factory.cursus({
          naam: 'A',
          projectnummer: '001',
          activiteiten: [
            factory.activiteit({ van: new Date(2021, 1, 1), vormingsuren: 20 }),
            factory.activiteit({ van: new Date(2021, 2, 1), vormingsuren: 20 }),
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
      projectId: project2021.id,
    });
    const aanmelding2 = await harness.createAanmelding({
      deelnemerId: deelnemerA.id,
      projectId: project2020.id,
    });
    const aanmelding3 = await harness.createAanmelding({
      deelnemerId: deelnemerB.id,
      projectId: project2021.id,
    });
    const aanmeldingen = await harness.patchAanmeldingen(project2021.id, [
      { id: aanmelding1.id, status: 'Aangemeld' },
      { id: aanmelding2.id, status: 'Aangemeld' },
      { id: aanmelding3.id, status: 'Bevestigd' },
    ]);
    await harness.updateDeelnames(
      project2021.id,
      project2021.activiteiten[0]!.id,
      [
        { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 0.5 }, // 20 * .5 = 10 deelnemersuren
        { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 1 }, // 20 * 1 = 20 deelnemersuren
        // total 30 deelnemersuren
      ],
    );
    await harness.updateDeelnames(
      project2021.id,
      project2021.activiteiten[1]!.id,
      [
        { aanmeldingId: aanmelding1.id, effectieveDeelnamePerunage: 0 }, // 20 * 0 = 0 deelnemersuren
        { aanmeldingId: aanmelding3.id, effectieveDeelnamePerunage: 0.5 }, // 20 * .5 = 10 deelnemersuren
        // total 10 deelnemersuren
      ],
    );
    await harness.updateDeelnames(
      project2020.id,
      project2020.activiteiten[0]!.id,
      [{ aanmeldingId: aanmelding2.id, effectieveDeelnamePerunage: 1 }], // 10 * 1 = 10 deelnemersuren
    );

    return { deelnemerA, deelnemerB, project2021, project2020, aanmeldingen };
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
