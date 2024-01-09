import { expect } from 'chai';
import { CursusLocatiesController } from './cursus-locaties.controller.js';
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
    it('GET /cursus-locaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/cursus-locaties').expect(200);
    });
    it('POST /cursus-locaties should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/cursus-locaties').expect(403);
    });

    it('PUT /cursus-locaties/:id should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.put('/cursus-locaties/1').expect(403);
    });

    it('DELETE /cursus-locaties/:id should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.delete('/cursus-locaties/1').expect(403);
    });
  });

  describe('GET /cursus-locaties', () => {
    it('should return all cursus-locaties', async () => {
      // Arrange
      const expectedLocaties = await Promise.all([
        harness.createCursusLocatie(
          factory.cursusLocatie({ naam: 'locatie 1' }),
        ),
        harness.createCursusLocatie(
          factory.cursusLocatie({
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

    it('by naam', async () => {
      // Arrange
      const locaties = await Promise.all([
        harness.createCursusLocatie(factory.cursusLocatie({ naam: 'foo' })),
        harness.createCursusLocatie(factory.cursusLocatie({ naam: 'foobar' })),
        harness.createCursusLocatie(factory.cursusLocatie({ naam: 'baz' })),
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

  describe('POST /cursus-locaties', () => {
    it('should create a cursus-locatie', async () => {
      // Arrange
      const cursusLocatie = factory.cursusLocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });

      // Act
      const created = await harness.createCursusLocatie(cursusLocatie);
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
      const cursusLocatie = factory.cursusLocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });

      // Act
      await harness.createCursusLocatie(cursusLocatie);
      await harness.post('/cursus-locaties').send(cursusLocatie).expect(422);
    });
  });

  describe('PUT /cursus-locaties/:id', () => {
    it('should update a cursus-locatie', async () => {
      // Arrange
      const { id } = await harness.createCursusLocatie(
        factory.cursusLocatie({
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
      const { id } = await harness.createCursusLocatie(
        factory.cursusLocatie({
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
      const cursusLocatie1 = factory.cursusLocatie({
        naam: 'locatie 1',
        adres: factory.adres({ straatnaam: 'straat 1' }),
      });
      const cursusLocatie2 = factory.cursusLocatie({
        naam: 'locatie 2',
        adres: factory.adres({ straatnaam: 'straat 2' }),
      });
      const { id } = await harness.createCursusLocatie(cursusLocatie1);
      await harness.createCursusLocatie(cursusLocatie2);

      // Act & Assert
      await harness.put(`/cursus-locaties/${id}`, cursusLocatie2).expect(422);
    });
  });

  describe('DELETE /cursus-locaties/:id', () => {
    it('should delete a cursus-locatie', async () => {
      // Arrange
      const { id } = await harness.createCursusLocatie(
        factory.cursusLocatie({
          naam: 'locatie 1',
          adres: factory.adres({ straatnaam: 'straat 1' }),
        }),
      );

      // Act
      await harness.deleteCursusLocatie(id);

      // Assert
      await harness.get(`/cursus-locaties/${id}`).expect(404);
    });
  });
});
