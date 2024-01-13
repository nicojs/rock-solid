import { expect } from 'chai';
import { CursusLocatiesController } from './cursuslocaties.controller.js';
import { byId, factory, harness } from './test-utils.test.js';
import { CursusLocatie } from '@rock-solid/shared';

describe(CursusLocatiesController.name, () => {
  beforeEach(() => {
    harness.login();
  });

  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /cursuslocaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/cursuslocaties').expect(200);
    });
    it('POST /cursuslocaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/cursuslocaties').expect(403);
    });

    it('PUT /cursuslocaties/:id should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/cursuslocaties/1').expect(403);
    });

    it('DELETE /cursuslocaties/:id should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/cursuslocaties/1').expect(403);
    });
  });

  describe('GET /cursuslocaties', () => {
    it('should return all cursuslocaties', async () => {
      // Arrange
      const expectedLocaties = await Promise.all([
        harness.createCursuslocatie(
          factory.cursuslocatie({ naam: 'locatie 1' }),
        ),
        harness.createCursuslocatie(
          factory.cursuslocatie({
            naam: 'locatie 2',
            adres: factory.adres({ straatnaam: 'straat 2' }),
          }),
        ),
      ]);

      // Act
      const actualLocaties = await harness.getAllCursusLocaties();

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(expectedLocaties.sort(byId));
    });

    it('paging', async () => {
      // Arrange
      for (let i = 0; i < 4; i++) {
        const locaties: Promise<CursusLocatie>[] = [];
        for (let j = 0; j < 5; j++) {
          locaties.push(
            harness.createCursuslocatie(
              factory.cursuslocatie({ naam: `locatie ${i}${j}` }),
            ),
          );
        }
        await Promise.all(locaties);
      }
      await harness.createCursuslocatie(
        factory.cursuslocatie({ naam: `locatie last` }),
      );

      // Act
      const [[firstPage, count], [secondPage]] = await Promise.all([
        harness.getCursusLocatiesPage(0),
        harness.getCursusLocatiesPage(1),
      ]);

      // Assert
      expect(firstPage).lengthOf(20);
      expect(secondPage).lengthOf(1);
      expect(count).equal(21);
    });

    it('by naam', async () => {
      // Arrange
      const locaties = await Promise.all([
        harness.createCursuslocatie(factory.cursuslocatie({ naam: 'foo' })),
        harness.createCursuslocatie(factory.cursuslocatie({ naam: 'foobar' })),
        harness.createCursuslocatie(factory.cursuslocatie({ naam: 'baz' })),
      ]);

      // Act
      const actualLocaties = await harness.getAllCursusLocaties({
        naam: 'foo',
      });

      // Assert
      expect(actualLocaties.sort(byId)).deep.equal(
        locaties.slice(0, -1).sort(byId),
      );
    });
  });

  describe('POST /cursuslocaties', () => {
    it('should create a cursus-locatie', async () => {
      // Arrange
      const cursusLocatie = factory.cursuslocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });

      // Act
      const created = await harness.createCursuslocatie(cursusLocatie);
      const actual = await harness.getCursusLocatie(created.id);

      // Assert
      expect(created).deep.equal({
        ...cursusLocatie,
        id: created.id,
        adres: { id: created.adres!.id, ...cursusLocatie.adres },
      });
      expect(actual).deep.equal(created);
    });

    it('should return a 422 "Unprocessable Entity" when the name already exists', async () => {
      // Arrange
      const cursusLocatie = factory.cursuslocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });

      // Act
      await harness.createCursuslocatie(cursusLocatie);
      await harness.post('/cursuslocaties').send(cursusLocatie).expect(422);
    });
  });

  describe('PUT /cursuslocaties/:id', () => {
    it('should update a cursus-locatie', async () => {
      // Arrange
      const { id } = await harness.createCursuslocatie(
        factory.cursuslocatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      const updated = await harness.updateCursusLocatie(id, {
        naam: 'locatie 2',
        adres: factory.adres({ straatnaam: 'straat 2' }),
      });
      const actual = await harness.getCursusLocatie(updated.id);

      // Assert
      const expected: CursusLocatie = {
        id,
        naam: 'locatie 2',
        adres: { ...updated.adres!, straatnaam: 'straat 2' },
      };
      expect(updated).deep.equal(expected);
      expect(actual).deep.equal(updated);
    });

    it('should be able to delete the adres', async () => {
      // Arrange
      const { id } = await harness.createCursuslocatie(
        factory.cursuslocatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      const updated = await harness.updateCursusLocatie(id, {
        naam: 'locatie 2',
        adres: undefined,
      });
      const actual = await harness.getCursusLocatie(updated.id);

      // Assert
      const expected: CursusLocatie = { id, naam: 'locatie 2' };
      expect(updated).deep.equal(expected);
      expect(actual).deep.equal(updated);
    });

    it('should return a 422 "Unprocessable Entity" when the name already exists', async () => {
      // Arrange
      const cursusLocatie1 = factory.cursuslocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });
      const cursusLocatie2 = factory.cursuslocatie({
        naam: 'locatie 2',
        adres: factory.adres({ straatnaam: 'straat 2' }),
      });
      const { id } = await harness.createCursuslocatie(cursusLocatie1);
      await harness.createCursuslocatie(cursusLocatie2);

      // Act & Assert
      await harness.put(`/cursuslocaties/${id}`, cursusLocatie2).expect(422);
    });
  });

  describe('DELETE /cursuslocaties/:id', () => {
    it('should delete a cursus-locatie', async () => {
      // Arrange
      const { id } = await harness.createCursuslocatie(
        factory.cursuslocatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      await harness.deleteCursusLocatie(id);

      // Assert
      await harness.get(`/cursuslocaties/${id}`).expect(404);
    });
  });
});
