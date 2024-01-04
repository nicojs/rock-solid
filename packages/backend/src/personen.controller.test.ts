import {
  AanmeldingOf,
  Contactpersoon,
  Cursus,
  Deelnemer,
  Foldervoorkeur,
  FotoToestemming,
  Vakantie,
} from '@rock-solid/shared';
import { PersonenController } from './personen.controller.js';
import { byId, factory, harness } from './test-utils.test.js';
import { expect } from 'chai';

describe(PersonenController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /personen should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/personen').expect(200);
    });
    it('DELETE /personen/1 should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/personen/1').expect(403);
    });
    it('POST /personen should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/personen').expect(403);
    });
    it('PUT /personen/1 should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/personen/1').expect(403);
    });
  });

  describe('GET /personen/:id/aanmeldingen', () => {
    let cursus1: Cursus;
    let cursus2: Cursus;
    let vakantie1: Vakantie;
    let vakantie2: Vakantie;
    let deelnemer1: Deelnemer;
    let deelnemer2: Deelnemer;
    beforeEach(async () => {
      [vakantie1, vakantie2, cursus1, cursus2, deelnemer1, deelnemer2] =
        await Promise.all([
          harness.createProject(factory.vakantie()),
          harness.createProject(factory.vakantie()),
          harness.createProject(factory.cursus()),
          harness.createProject(factory.cursus()),
          harness.createDeelnemer(factory.deelnemer()),
          harness.createDeelnemer(factory.deelnemer()),
        ]);
    });

    it('should retrieve project aanmeldingen with status', async () => {
      // Arrange
      await harness.createAanmelding({
        projectId: cursus1.id,
        deelnemerId: deelnemer1.id,
        status: 'Bevestigd',
      });
      await harness.createAanmelding({
        projectId: cursus2.id,
        deelnemerId: deelnemer1.id,
        status: 'Aangemeld',
      });
      await harness.createAanmelding({
        projectId: cursus2.id,
        deelnemerId: deelnemer2.id,
        status: 'Aangemeld',
      });
      await harness.createAanmelding({
        projectId: vakantie1.id,
        deelnemerId: deelnemer1.id,
        status: 'Geannuleerd',
      });
      await harness.createAanmelding({
        projectId: vakantie2.id,
        deelnemerId: deelnemer2.id,
        status: 'Geannuleerd',
      });

      // Act
      const [actualCursussen, actualVakanties] = await Promise.all([
        harness.getDeelnemerProjectAanmeldingen(deelnemer1.id, {
          type: 'cursus',
        }),
        harness.getDeelnemerProjectAanmeldingen(deelnemer1.id, {
          type: 'vakantie',
        }),
      ]);

      // Assert
      const expectedCursusAanmeldingen: AanmeldingOf<Cursus>[] = [
        { ...cursus1, aantalAanmeldingen: 1, status: 'Bevestigd' },
        { ...cursus2, aantalAanmeldingen: 2, status: 'Aangemeld' },
      ];
      const expectedVakantieAanmeldingen: AanmeldingOf<Vakantie>[] = [
        { ...vakantie1, aantalAanmeldingen: 1, status: 'Geannuleerd' },
      ];
      expect(actualCursussen.sort(byId)).deep.eq(
        expectedCursusAanmeldingen.sort(byId),
      );
      expect(actualVakanties.sort(byId)).deep.eq(
        expectedVakantieAanmeldingen.sort(),
      );
    });
  });

  describe('GET /personen', () => {
    it('by volledigeNaamLike', async () => {
      // Arrange
      const [fooBar, bazQux, bond] = await Promise.all([
        harness.createDeelnemer(
          factory.deelnemer({ voornaam: 'Foo', achternaam: 'Bar' }),
        ),
        harness.createDeelnemer(
          factory.deelnemer({ voornaam: 'Baz', achternaam: 'Qux' }),
        ),
        harness.createOverigPersoon(
          factory.overigPersoon({ voornaam: undefined, achternaam: 'Bond' }),
        ),
      ]);

      // Act
      const [oo, ba, bazQu, ond, fooBaz] = await Promise.all([
        harness.getAllPersonen({ volledigeNaamLike: 'oo' }),
        harness.getAllPersonen({ volledigeNaamLike: 'ba' }),
        harness.getAllPersonen({ volledigeNaamLike: 'Baz qu' }),
        harness.getAllPersonen({ volledigeNaamLike: 'ond' }),
        harness.getAllPersonen({ volledigeNaamLike: 'foo Baz' }),
      ]);
      const noFilter = await harness.getAllPersonen({
        volledigeNaamLike: undefined,
      });

      // Assert
      expect(oo).deep.eq([fooBar]);
      expect(ba.sort(byId)).deep.eq([fooBar, bazQux].sort(byId));
      expect(bazQu).deep.eq([bazQux]);
      expect(ond).deep.eq([bond]);
      expect(fooBaz).deep.eq([]);
      expect(noFilter.sort(byId)).deep.eq([fooBar, bazQux, bond].sort(byId));
    });

    it('by selectie', async () => {
      // Arrange
      const [deelnemer, overigPersoon, bestuurslid, vrijwilliger, werknemer] =
        await Promise.all([
          harness.createDeelnemer(factory.deelnemer()),
          harness.createOverigPersoon(factory.overigPersoon({ selectie: [] })),
          harness.createOverigPersoon(
            factory.overigPersoon({
              selectie: ['algemeneVergaderingDeBedding'],
            }),
          ),
          harness.createOverigPersoon(
            factory.overigPersoon({ selectie: ['vakantieVrijwilliger'] }),
          ),
          harness.createOverigPersoon(
            factory.overigPersoon({
              selectie: ['vakantieVrijwilliger', 'personeel'],
            }),
          ),
        ]);

      // Act
      const [
        personeelResult,
        algemeneVergaderingResult,
        noSelectieResult,
        noFilterResult,
      ] = await Promise.all([
        harness.getAllPersonen({ selectie: ['personeel'] }),
        harness.getAllPersonen({
          selectie: [
            'algemeneVergaderingDeBedding',
            'algemeneVergaderingDeKei',
          ],
        }),
        harness.getAllPersonen({ selectie: [] }),
        harness.getAllPersonen({ selectie: undefined }),
      ]);

      // Assert
      expect(personeelResult).deep.eq([werknemer]);
      expect(algemeneVergaderingResult).deep.eq([bestuurslid]);
      expect(noSelectieResult.sort(byId)).deep.eq(
        [deelnemer, overigPersoon, bestuurslid, vrijwilliger, werknemer].sort(
          byId,
        ),
      );
      expect(noFilterResult.sort(byId)).deep.eq(
        [deelnemer, overigPersoon, bestuurslid, vrijwilliger, werknemer].sort(
          byId,
        ),
      );
    });

    it('by foldersoort', async () => {
      // Arrange
      const [
        deelnemerNoFolder,
        deelnemerDeKei,
        deelnemerBuso,
        deelnemerNietBuso,
        deelnemerKeiJong,
      ] = await Promise.all([
        harness.createDeelnemer(factory.deelnemer()),
        harness.createDeelnemer(
          factory.deelnemer({
            achternaam: 'deKeiCursussen',
            foldervoorkeuren: [
              { folder: 'deKeiCursussen', communicatie: 'post' },
            ],
          }),
        ),
        harness.createDeelnemer(
          factory.deelnemer({
            achternaam: 'keiJongBuso',
            foldervoorkeuren: [{ folder: 'keiJongBuso', communicatie: 'post' }],
          }),
        ),
        harness.createDeelnemer(
          factory.deelnemer({
            achternaam: 'keiJongNietBuso',
            foldervoorkeuren: [
              { folder: 'keiJongNietBuso', communicatie: 'post' },
            ],
          }),
        ),
        harness.createDeelnemer(
          factory.deelnemer({
            achternaam: 'keiJong',
            foldervoorkeuren: [
              { folder: 'keiJongBuso', communicatie: 'post' },
              { folder: 'keiJongNietBuso', communicatie: 'post' },
            ],
          }),
        ),
      ]);

      // Act
      const [actualDeKei, actualKeiJongBuso, actualKeiJong, actualNoFilter] =
        await Promise.all([
          harness.getAllPersonen({ foldersoorten: ['deKeiCursussen'] }),
          harness.getAllPersonen({ foldersoorten: ['keiJongBuso'] }),
          harness.getAllPersonen({
            foldersoorten: ['keiJongBuso', 'keiJongNietBuso'],
          }),
          harness.getAllPersonen({ foldersoorten: [] }),
        ]);

      // Assert
      expect(actualDeKei).deep.eq([deelnemerDeKei]);
      expect(actualKeiJongBuso.sort(byId)).deep.eq(
        [deelnemerBuso, deelnemerKeiJong].sort(byId),
      );
      expect(actualKeiJong.sort(byId)).deep.eq(
        [deelnemerBuso, deelnemerKeiJong, deelnemerNietBuso].sort(byId),
      );
      expect(actualNoFilter.sort(byId)).deep.eq(
        [
          deelnemerNoFolder,
          deelnemerDeKei,
          deelnemerBuso,
          deelnemerNietBuso,
          deelnemerKeiJong,
        ].sort(byId),
      );
    });

    it('by minLeeftijd', async () => {
      // Arrange
      const { deelnemer17Y, deelnemer18Y, deelnemerNoGeboortedatum } =
        await arrangeLeeftijdDeelnemers();

      // Act
      const [deelnemers18Years, deelnemers17Years, noFilter] =
        await Promise.all([
          harness.getAllPersonen({ minLeeftijd: 18 }),
          harness.getAllPersonen({ minLeeftijd: 17 }),
          harness.getAllPersonen({ minLeeftijd: undefined }),
        ]);

      // Assert
      expect(deelnemers18Years).deep.eq([deelnemer18Y]);
      expect(deelnemers17Years.sort(byId)).deep.eq(
        [deelnemer18Y, deelnemer17Y].sort(byId),
      );
      expect(noFilter.sort(byId)).deep.eq(
        [deelnemer18Y, deelnemer17Y, deelnemerNoGeboortedatum].sort(byId),
      );
    });

    it('by maxLeeftijd', async () => {
      // Arrange
      const { deelnemer17Y, deelnemer18Y, deelnemerNoGeboortedatum } =
        await arrangeLeeftijdDeelnemers();

      // Act
      const [deelnemers18Years, deelnemers17Years, noFilter] =
        await Promise.all([
          harness.getAllPersonen({ maxLeeftijd: 18 }),
          harness.getAllPersonen({ maxLeeftijd: 17 }),
          harness.getAllPersonen({ maxLeeftijd: undefined }),
        ]);

      // Assert
      expect(deelnemers18Years.sort(byId)).deep.eq(
        [deelnemer17Y, deelnemer18Y].sort(byId),
      );
      expect(deelnemers17Years).deep.eq([deelnemer17Y]);
      expect(noFilter.sort(byId)).deep.eq(
        [deelnemer18Y, deelnemer17Y, deelnemerNoGeboortedatum].sort(byId),
      );
    });

    it('by laatsteAanmeldingMinimaalJaarGeleden', async () => {
      // Arrange
      const {
        deelnemer1,
        deelnemer2,
        deelnemer3,
        deelnemer4,
        deelnemerNoAanmeldingen,
      } = await arrangeJaarGeledenDeelnemers();

      // Act
      const [deelnemersOneYearAgo, deelnemersTwoYearsAgo, noFilter] =
        await Promise.all([
          harness.getAllPersonen({
            laatsteAanmeldingMinimaalJaarGeleden: 1,
          }),
          harness.getAllPersonen({
            laatsteAanmeldingMinimaalJaarGeleden: 2,
          }),
          harness.getAllPersonen({
            laatsteAanmeldingMinimaalJaarGeleden: undefined,
          }),
        ]);

      // Assert
      expect(deelnemersOneYearAgo).deep.eq([deelnemer1]);
      expect(deelnemersTwoYearsAgo.sort(byId)).deep.eq(
        [deelnemer1, deelnemer2, deelnemer4].sort(byId),
      );
      expect(noFilter.sort(byId)).deep.eq(
        [
          deelnemer1,
          deelnemer2,
          deelnemer3,
          deelnemer4,
          deelnemerNoAanmeldingen,
        ].sort(byId),
      );
    });

    it('by laatsteAanmeldingMaximaalJaarGeleden', async () => {
      // Arrange
      const {
        deelnemer1,
        deelnemer2,
        deelnemer3,
        deelnemer4,
        deelnemerNoAanmeldingen,
      } = await arrangeJaarGeledenDeelnemers();

      // Act
      const [
        deelnemersMax1Year,
        deelnemersMax2YearsAgo,
        deelnemersMax3YearsAgo,
        deelnemersMax4YearsAgo,
        noFilter,
      ] = await Promise.all([
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 1,
        }),
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 2,
        }),
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 3,
        }),
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 4,
        }),
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: undefined,
        }),
      ]);

      // Assert
      expect(deelnemersMax1Year.sort(byId)).deep.eq(
        [deelnemer1, deelnemer2, deelnemer3, deelnemer4].sort(byId),
      );
      expect(deelnemersMax2YearsAgo.sort(byId)).deep.eq(
        [deelnemer2, deelnemer3, deelnemer4].sort(byId),
      );
      expect(deelnemersMax3YearsAgo).deep.eq([deelnemer3]);
      expect(deelnemersMax4YearsAgo).deep.eq([]);
      expect(noFilter.sort(byId)).deep.eq(
        [
          deelnemer1,
          deelnemer2,
          deelnemer3,
          deelnemer4,
          deelnemerNoAanmeldingen,
        ].sort(byId),
      );
    });

    it('by laatsteAanmeldingMaximaalJaarGeleden and laatsteAanmeldingMinimaalJaarGeleden', async () => {
      // Arrange
      const { deelnemer1, deelnemer2, deelnemer4 } =
        await arrangeJaarGeledenDeelnemers();

      // Act
      const [deelnemersLastYear, deelnemers2YearAgoExact] = await Promise.all([
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 1,
          laatsteAanmeldingMinimaalJaarGeleden: 1,
        }),
        harness.getAllPersonen({
          laatsteAanmeldingMaximaalJaarGeleden: 2,
          laatsteAanmeldingMinimaalJaarGeleden: 2,
        }),
      ]);

      // Assert
      expect(deelnemersLastYear).deep.eq([deelnemer1]);
      expect(deelnemers2YearAgoExact.sort(byId)).deep.eq(
        [deelnemer2, deelnemer4].sort(byId),
      );
    });

    it('by zonderAanmeldingen', async () => {
      // Arrange
      const { deelnemerNoAanmeldingen } = await arrangeJaarGeledenDeelnemers();

      // Act
      const [zonderAanmeldingen, nietZonderAanmeldingen, noFilter] =
        await Promise.all([
          harness.getAllPersonen({ zonderAanmeldingen: true }),
          harness.getAllPersonen({ zonderAanmeldingen: false }),
          harness.getAllPersonen({ zonderAanmeldingen: undefined }),
        ]);

      await harness.getAllPersonen({ zonderAanmeldingen: true });
      // Assert
      expect(zonderAanmeldingen).deep.eq([deelnemerNoAanmeldingen]);
      expect(nietZonderAanmeldingen).lengthOf(5);
      expect(noFilter).lengthOf(5);
      // zonderAanmeldingen false or undefined should be the same (it's a checkbox)
      expect(noFilter.sort(byId)).deep.eq(nietZonderAanmeldingen.sort(byId));
    });

    async function arrangeJaarGeledenDeelnemers() {
      const { y, m, d } = today();
      const lastYear = new Date(y - 1, m, d);
      const twoYearAgo = new Date(y - 2, m, d);
      const threeYearsAgo = new Date(y - 3, m, d);
      const [
        deelnemer1,
        deelnemer2,
        deelnemer3,
        deelnemer4,
        deelnemerNoAanmeldingen,
      ] = await Promise.all([
        harness.createDeelnemer(factory.deelnemer({ achternaam: '1' })),
        harness.createDeelnemer(factory.deelnemer({ achternaam: '2' })),
        harness.createDeelnemer(factory.deelnemer({ achternaam: '3' })),
        harness.createDeelnemer(factory.deelnemer({ achternaam: '4' })),
        harness.createDeelnemer(
          factory.deelnemer({ achternaam: 'no aanmeldingen' }),
        ),
      ]);

      const [projectOneYearAgo, projectTwoYearsAgo, projectThreeYearsAgo] =
        await Promise.all([
          harness.createProject(
            factory.cursus({
              activiteiten: [factory.activiteit({ van: lastYear })],
            }),
          ),
          harness.createProject(
            factory.cursus({
              activiteiten: [factory.activiteit({ van: twoYearAgo })],
            }),
          ),
          harness.createProject(
            factory.cursus({
              activiteiten: [factory.activiteit({ van: threeYearsAgo })],
            }),
          ),
        ]);

      await Promise.all([
        harness.createAanmelding({
          deelnemerId: deelnemer1.id,
          projectId: projectOneYearAgo.id,
        }),
        harness.createAanmelding({
          deelnemerId: deelnemer2.id,
          projectId: projectTwoYearsAgo.id,
        }),
        harness.createAanmelding({
          deelnemerId: deelnemer3.id,
          projectId: projectThreeYearsAgo.id,
        }),
        harness.createAanmelding({
          deelnemerId: deelnemer4.id,
          projectId: projectThreeYearsAgo.id,
        }),
      ]);
      // Create aanmelding is currently not thread-safe.
      await harness.createAanmelding({
        deelnemerId: deelnemer4.id,
        projectId: projectTwoYearsAgo.id,
      });
      deelnemer1.eersteCursus = projectOneYearAgo.projectnummer;
      deelnemer2.eersteCursus = projectTwoYearsAgo.projectnummer;
      deelnemer3.eersteCursus = projectThreeYearsAgo.projectnummer;
      deelnemer4.eersteCursus = projectThreeYearsAgo.projectnummer;
      return {
        deelnemer1,
        deelnemer2,
        deelnemer3,
        deelnemer4,
        projectOneYearAgo,
        projectTwoYearsAgo,
        projectThreeYearsAgo,
        deelnemerNoAanmeldingen,
      };
    }

    async function arrangeLeeftijdDeelnemers() {
      const { y, m, d } = today();

      const [deelnemer18Y, deelnemer17Y, deelnemerNoGeboortedatum] =
        await Promise.all([
          harness.createDeelnemer(
            factory.deelnemer({
              achternaam: '18Years',
              geboortedatum: new Date(y - 18, m, d),
            }),
          ),
          harness.createDeelnemer(
            factory.deelnemer({
              achternaam: '17Years',
              geboortedatum: new Date(y - 18, m, d + 1),
            }),
          ),
          harness.createDeelnemer(
            factory.deelnemer({
              achternaam: 'noGeboortedatum',
              geboortedatum: undefined,
            }),
          ),
        ]);
      return { deelnemer18Y, deelnemer17Y, deelnemerNoGeboortedatum };
    }
  });

  describe('PUT /personen/:id', () => {
    let deelnemer: Deelnemer;
    beforeEach(async () => {
      deelnemer = await harness.createDeelnemer(
        factory.deelnemer({
          verblijfadres: {
            straatnaam: 'Kerkstraat',
            huisnummer: '123',
            plaats: harness.db.seedPlaats,
          },
        }),
      );
    });

    it('should be able to delete only the verblijfadres', async () => {
      // Act
      await harness.updateDeelnemer({
        ...deelnemer,
        verblijfadres: undefined,
        domicilieadres: undefined,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.verblijfadres).undefined;
      expect(actualDeelnemer.domicilieadres).undefined;
    });

    it('should be able to update contactpersoon fields', async () => {
      // Arrange
      const contactpersoon: Contactpersoon = {
        naam: 'Jan',
        telefoon: '012345678',
        gsm: '987654321',
        email: 'jan@example.org',
      };

      // Act
      await harness.updateDeelnemer({
        ...deelnemer,
        contactpersoon,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.contactpersoon).deep.eq(contactpersoon);
    });

    it('should be able to update folder voorkeur', async () => {
      // Arrange
      const foldervoorkeur: Foldervoorkeur = {
        folder: 'deKeiCursussen',
        communicatie: 'post',
      };

      // Act
      await harness.updateDeelnemer({
        ...deelnemer,
        foldervoorkeuren: [foldervoorkeur],
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.foldervoorkeuren).deep.eq([foldervoorkeur]);
    });

    it('should be able to delete contactpersoon fields', async () => {
      // Arrange
      const contactpersoon: Contactpersoon = {
        naam: 'Jan',
        telefoon: '012345678',
        gsm: '987654321',
        email: 'jan@example.org',
      };
      await harness.updateDeelnemer({
        ...deelnemer,
        contactpersoon,
      });
      delete contactpersoon.naam;
      delete contactpersoon.telefoon;

      // Act
      await harness.updateDeelnemer({
        ...deelnemer,
        contactpersoon,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.contactpersoon).deep.eq(contactpersoon);
    });

    it('should be able to update fototoestemming fields', async () => {
      // Arrange
      const fotoToestemming: FotoToestemming = {
        folder: true,
        website: true,
        socialeMedia: true,
        nieuwsbrief: true,
        infoboekje: true,
      };

      // Act
      await harness.updateDeelnemer({
        ...deelnemer,
        fotoToestemming,
      });

      // Assert
      const actualDeelnemer = await harness.getDeelnemer(deelnemer.id);
      expect(actualDeelnemer.fotoToestemming).deep.eq(fotoToestemming);
    });
  });

  describe('DELETE /persoon/:id', () => {
    it('should delete an overig persoon with selectie', async () => {
      // Arrange
      const overigPersoon = await harness.createOverigPersoon(
        factory.overigPersoon({ selectie: ['personeel'] }),
      );

      // Act
      await harness.delete(`/personen/${overigPersoon.id}`).expect(204);

      // Assert
      await harness.get(`/personen/${overigPersoon.id}`).expect(404);
    });
  });
});

function today() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return { y, m, d };
}
