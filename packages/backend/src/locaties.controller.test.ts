import { expect } from 'chai';
import { LocatiesController } from './locaties.controller.js';
import { byId, factory, harness } from './test-utils.test.js';
import { Locatie } from '@rock-solid/shared';

describe(LocatiesController.name, () => {
  beforeEach(() => {
    harness.login();
  });

  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /locaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/locaties').expect(200);
    });
    it('POST /locaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/locaties').expect(403);
    });

    it('PUT /locaties/:id should be allowed for projectverantwoordelijke', async () => {
      const locatie = await harness.createLocatie(factory.locatie());
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put(`/locaties/${locatie.id}`, locatie).expect(200);
    });

    it('DELETE /locaties/:id should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/locaties/1').expect(403);
    });
  });

  describe('GET /locaties', () => {
    it('should return all locaties', async () => {
      // Arrange
      const expectedLocaties = await Promise.all([
        harness.createLocatie(factory.locatie({ naam: 'locatie 1' })),
        harness.createLocatie(
          factory.locatie({
            naam: 'locatie 2',
            adres: factory.adres({ straatnaam: 'straat 2' }),
          }),
        ),
      ]);

      // Act
      const actualLocaties = await harness.getAllLocaties();

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(expectedLocaties.sort(byId));
    });

    it('paging', async () => {
      // Arrange
      for (let i = 0; i < 4; i++) {
        const locaties: Promise<Locatie>[] = [];
        for (let j = 0; j < 5; j++) {
          locaties.push(
            harness.createLocatie(
              factory.locatie({ naam: `locatie ${i}${j}` }),
            ),
          );
        }
        await Promise.all(locaties);
      }
      await harness.createLocatie(factory.locatie({ naam: `locatie last` }));

      // Act
      const [[firstPage, count], [secondPage]] = await Promise.all([
        harness.getLocatiesPage(0),
        harness.getLocatiesPage(1),
      ]);

      // Assert
      expect(firstPage).lengthOf(20);
      expect(secondPage).lengthOf(1);
      expect(count).equal(21);
    });

    it('by naam', async () => {
      // Arrange
      const locaties = await Promise.all([
        harness.createLocatie(factory.locatie({ naam: 'foo' })),
        harness.createLocatie(factory.locatie({ naam: 'foobar' })),
        harness.createLocatie(factory.locatie({ naam: 'baz' })),
      ]);

      // Act
      const actualLocaties = await harness.getAllLocaties({
        naam: 'foo',
      });

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(
        locaties.slice(0, -1).sort(byId),
      );
    });

    it('by soort', async () => {
      // Arrange
      const locaties = await Promise.all([
        harness.createLocatie(
          factory.locatie({ naam: '1', soort: 'opstapplaats' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: '2', soort: 'cursushuis' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: '3', soort: 'opstapplaats' }),
        ),
      ]);

      // Act
      const actualLocaties = await harness.getAllLocaties({
        soort: 'opstapplaats',
      });

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(
        [locaties[0], locaties[2]].sort(byId),
      );
    });

    it('by "geschiktVoorVakanties"', async () => {
      // Arrange
      const locaties = await Promise.all([
        harness.createLocatie(
          factory.locatie({ naam: '1', geschiktVoorVakantie: true }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: '2', geschiktVoorVakantie: false }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: '3', geschiktVoorVakantie: true }),
        ),
      ]);

      // Act
      const actualLocaties = await harness.getAllLocaties({
        geschiktVoorVakantie: true,
      });

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(
        [locaties[0], locaties[2]].sort(byId),
      );  
    });
  });

  describe('POST /locaties', () => {
    it('should create a locatie', async () => {
      // Arrange
      const opstapplaats = factory.locatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
        opmerking: 'Modder op de oprit',
        soort: 'opstapplaats',
      });

      // Act
      const created = await harness.createLocatie(opstapplaats);
      const actual = await harness.getLocatie(created.id);

      // Assert
      expect(created).deep.equal({
        ...opstapplaats,
        id: created.id,
        adres: { id: created.adres!.id, ...opstapplaats.adres },
      });
      expect(actual).deep.equal(created);
    });

    it('should return a 422 "Unprocessable Entity" when the name already exists', async () => {
      // Arrange
      const cursusLocatie = factory.locatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });

      // Act
      await harness.createLocatie(cursusLocatie);
      await harness.post('/locaties').send(cursusLocatie).expect(422);
    });
  });

  describe('PUT /locaties/:id', () => {
    it('should update a locatie', async () => {
      // Arrange
      const { id } = await harness.createLocatie(
        factory.locatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      const updated = await harness.updateLocatie(id, {
        naam: 'locatie 2',
        adres: factory.adres({ straatnaam: 'straat 2' }),
        soort: 'cursushuis',
      });
      const actual = await harness.getLocatie(updated.id);

      // Assert
      const expected: Locatie = {
        id,
        naam: 'locatie 2',
        soort: 'cursushuis',
        adres: { ...updated.adres!, straatnaam: 'straat 2' },
      };
      expect(updated).deep.equal(expected);
      expect(actual).deep.equal(updated);
    });

    it('should be able to delete the adres', async () => {
      // Arrange
      const { id } = await harness.createLocatie(
        factory.locatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      const updated = await harness.updateLocatie(id, {
        naam: 'locatie 2',
        soort: 'cursushuis',
        adres: undefined,
      });
      const actual = await harness.getLocatie(updated.id);

      // Assert
      const expected: Locatie = { id, naam: 'locatie 2', soort: 'cursushuis' };
      expect(updated).deep.equal(expected);
      expect(actual).deep.equal(updated);
    });

    it('should be able to delete opmerking', async () => {
      // Arrange
      const locatie = await harness.createLocatie(
        factory.locatie({ opmerking: 'Modder op de oprit' }),
      );

      // Act
      const updated = await harness.updateLocatie(locatie.id, {
        ...locatie,
        opmerking: undefined,
      });

      // Assert
      expect(updated.opmerking).undefined;
    });

    it('should return a 422 "Unprocessable Entity" when the name already exists', async () => {
      // Arrange
      const cursusLocatie1 = factory.locatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });
      const cursusLocatie2 = factory.locatie({
        naam: 'locatie 2',
        adres: factory.adres({ straatnaam: 'straat 2' }),
      });
      const { id } = await harness.createLocatie(cursusLocatie1);
      await harness.createLocatie(cursusLocatie2);

      // Act & Assert
      await harness.put(`/locaties/${id}`, cursusLocatie2).expect(422);
    });
  });

  describe('DELETE /locaties/:id', () => {
    it('should delete a locatie', async () => {
      // Arrange
      const { id } = await harness.createLocatie(
        factory.locatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      await harness.deleteLocatie(id);

      // Assert
      await harness.get(`/locaties/${id}`).expect(404);
    });
  });
});
