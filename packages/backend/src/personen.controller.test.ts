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

  describe('GET /personen?searchType=persoon', () => {
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
          harness.getAllPersonen({
            searchType: 'persoon',
            foldersoorten: ['deKeiCursussen'],
          }),
          harness.getAllPersonen({
            searchType: 'persoon',
            foldersoorten: ['keiJongBuso'],
          }),
          harness.getAllPersonen({
            searchType: 'persoon',
            foldersoorten: ['keiJongBuso', 'keiJongNietBuso'],
          }),
          harness.getAllPersonen({ searchType: 'persoon', foldersoorten: [] }),
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
});
