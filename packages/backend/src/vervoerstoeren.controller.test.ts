import { Vervoerstoer } from '@rock-solid/shared';
import { expect } from 'chai';
import { VervoerstoerenController } from './vervoerstoeren.controller.js';
import { factory, harness } from './test-utils.test.js';

describe.only(VervoerstoerenController.name, () => {
  beforeEach(() => {
    harness.login();
  });

  afterEach(async () => {
    await harness.clear();
  });

  describe('auth', () => {
    it('GET /vervoerstoeren should be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/vervoerstoeren').expect(200);
    });

    it('POST /vervoerstoeren should be allowed for projectverantwoordelijke', async () => {
      const vervoerstoer = await arrangeVervoerstoer();
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.post('/vervoerstoeren', vervoerstoer).expect(201);
    });

    it('PUT /vervoerstoeren should be allowed for projectverantwoordelijke', async () => {
      const vervoerstoer = await arrangeCreatedVervoerstoer();
      const [, chauffeur] = await Promise.all([
        harness.createProject(factory.vakantie()),
        harness.createOverigPersoon(factory.overigPersoon({ achternaam: 'Bestuurder B' })),
      ]);
      harness.login({ role: 'projectverantwoordelijke' });

      const updated: Vervoerstoer = {
        ...vervoerstoer,
        routes: [
          {
            id: vervoerstoer.routes[0]!.id,
            chauffeur,
            stops: vervoerstoer.routes[0]!.stops,
          },
        ],
      };

      await harness.put('/vervoerstoeren', updated).expect(200);
    });

    it('POST /vervoerstoeren should not be allowed for financieelBeheerder', async () => {
      const vervoerstoer = await arrangeVervoerstoer();
      harness.login({ role: 'financieelBeheerder' });
      await harness.post('/vervoerstoeren', vervoerstoer).expect(403);
    });
  });

  describe('POST /vervoerstoeren', () => {
    it('should create one vervoerstoer aggregate', async () => {
      const requestBody = await arrangeVervoerstoer();

      const response = await harness
        .post('/vervoerstoeren', requestBody)
        .expect(201);
      const created: Vervoerstoer = response.body;

      expect(created.id).greaterThan(0);
      expect(created.projectIds.sort((a, b) => a - b)).deep.eq(
        requestBody.projectIds.sort((a, b) => a - b),
      );
      expect(created.routes).lengthOf(1);
      expect(created.routes[0]!.chauffeur.id).eq(requestBody.routes[0]!.chauffeur.id);
      expect(created.routes[0]!.stops.map((stop) => stop.locatie.id)).deep.eq(
        requestBody.routes[0]!.stops.map((stop) => stop.locatie.id),
      );
      expect(created.naam).to.be.a('string').and.not.empty;

      const all = await harness.get('/vervoerstoeren').expect(200);
      expect(all.body).deep.eq([created]);
    });
  });

  describe('PUT /vervoerstoeren', () => {
    it('should replace one vervoerstoer aggregate', async () => {
      const created = await arrangeCreatedVervoerstoer();
      const [nieuwProject, nieuweChauffeur, nieuweLocatie] = await Promise.all([
        harness.createProject(factory.vakantie()),
        harness.createOverigPersoon(factory.overigPersoon({ achternaam: 'Nieuwe bestuurder' })),
        harness.createLocatie(factory.locatie({ naam: 'Nieuwe opstap', soort: 'opstapplaats' })),
      ]);

      const updatedInput: Vervoerstoer = {
        ...created,
        projectIds: [nieuwProject.id],
        routes: [
          {
            id: created.routes[0]!.id,
            chauffeur: nieuweChauffeur,
            stops: [
              {
                id: created.routes[0]!.stops[0]!.id,
                volgnummer: 10,
                locatie: nieuweLocatie,
              },
            ],
          },
        ],
      };

      const updateResponse = await harness
        .put('/vervoerstoeren', updatedInput)
        .expect(200);
      const updated: Vervoerstoer = updateResponse.body;

      expect(updated.id).eq(created.id);
      expect(updated.projectIds).deep.eq([nieuwProject.id]);
      expect(updated.routes).lengthOf(1);
      expect(updated.routes[0]!.chauffeur.id).eq(nieuweChauffeur.id);
      expect(updated.routes[0]!.stops).deep.eq([
        {
          id: updated.routes[0]!.stops[0]!.id,
          volgnummer: 10,
          locatie: nieuweLocatie,
        },
      ]);

      const all = await harness.get('/vervoerstoeren').expect(200);
      expect(all.body).deep.eq([updated]);
    });
  });
});

async function arrangeVervoerstoer(): Promise<Vervoerstoer> {
  const [projectA, projectB, chauffeur, stopA, stopB] = await Promise.all([
    harness.createProject(factory.vakantie()),
    harness.createProject(factory.cursus()),
    harness.createOverigPersoon(factory.overigPersoon({ achternaam: 'Bestuurder A' })),
    harness.createLocatie(factory.locatie({ naam: 'Opstap A', soort: 'opstapplaats' })),
    harness.createLocatie(factory.locatie({ naam: 'Opstap B', soort: 'opstapplaats' })),
  ]);

  return {
    id: 0,
    naam: 'Wordt afgeleid',
    projectIds: [projectA.id, projectB.id],
    routes: [
      {
        id: 0,
        chauffeur,
        stops: [
          {
            id: 0,
            volgnummer: 1,
            locatie: stopA,
          },
          {
            id: 0,
            volgnummer: 2,
            locatie: stopB,
          },
        ],
      },
    ],
  };
}

async function arrangeCreatedVervoerstoer(): Promise<Vervoerstoer> {
  const vervoerstoer = await arrangeVervoerstoer();
  const response = await harness.post('/vervoerstoeren', vervoerstoer).expect(201);
  return response.body;
}
