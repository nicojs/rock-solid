import { UpsertableVervoerstoer, Vervoerstoer } from '@rock-solid/shared';
import { expect } from 'chai';
import { VervoerstoerenController } from './vervoerstoeren.controller.js';
import { factory, harness } from './test-utils.test.js';

describe(VervoerstoerenController.name, () => {
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
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Bestuurder B' }),
        ),
      ]);
      harness.login({ role: 'projectverantwoordelijke' });

      const updated: Vervoerstoer = {
        ...vervoerstoer,
        routes: [
          {
            id: vervoerstoer.routes[0]!.id,
            chauffeur,
            stops: vervoerstoer.routes[0]!.stops ?? [],
          },
        ],
      };

      await harness
        .put(`/vervoerstoeren/${vervoerstoer.id}`, updated)
        .expect(200);
    });

    it('POST /vervoerstoeren should not be allowed for financieelBeheerder', async () => {
      const vervoerstoer = await arrangeVervoerstoer();
      harness.login({ role: 'financieelBeheerder' });
      await harness.post('/vervoerstoeren', vervoerstoer).expect(403);
    });
  });

  describe('POST /vervoerstoeren', () => {
    it('should create a vervoerstoer with a bestemming stop', async () => {
      const [projectA, projectB, bestemming] = await Promise.all([
        harness.createProject(factory.vakantie()),
        harness.createProject(factory.cursus()),
        harness.createLocatie(
          factory.locatie({ naam: 'Bestemming', soort: 'cursushuis' }),
        ),
      ]);
      const created = await harness.createVervoerstoer({
        projectIds: [projectA.id, projectB.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [],
      });

      expect(created.id).greaterThan(0);
      expect(created.projectIds.sort()).deep.eq(
        [projectA.id, projectB.id].sort(),
      );
      expect(created.toeTeKennenStops).lengthOf(0);
      expect(created.bestemmingStop).to.not.be.undefined;
      expect(created.bestemmingStop!.locatie.id).eq(bestemming.id);
      expect(created.routes).deep.eq([]);
    });

    it('should create one vervoerstoer aggregate', async () => {
      const requestBody = await arrangeVervoerstoer();

      const created = await harness.createVervoerstoer(requestBody);

      expect(created.id).greaterThan(0);
      expect(created.projectIds.sort()).deep.eq(requestBody.projectIds.sort());
      expect(created.routes).lengthOf(1);
      expect(created.routes[0]!.chauffeur.id).eq(
        requestBody.routes[0]!.chauffeur.id,
      );
      expect(created.routes[0]!.vertrekadres?.straatnaam).eq('Vertrekstraat');
      expect(created.routes[0]!.stops.map((stop) => stop.locatie.id)).deep.eq(
        requestBody.routes[0]!.stops.map((stop) => stop.locatie.id),
      );
      expect(created.routes[0]!.stops).to.have.length.greaterThan(0);
      expect(created.naam).to.be.a('string').and.not.empty;

      const all: Vervoerstoer[] = (
        await harness.get('/vervoerstoeren').expect(200)
      ).body;
      expect(all).lengthOf(1);
      all[0]!.projectIds.sort();
      created.projectIds.sort();
      expect(all[0]).deep.eq(created);
    });
  });

  describe('PUT /vervoerstoeren', () => {
    it('should replace one vervoerstoer aggregate', async () => {
      const created = await arrangeCreatedVervoerstoer();
      const [nieuwProject, nieuweChauffeur, nieuweLocatie, nieuweBestemming] =
        await Promise.all([
          harness.createProject(factory.vakantie()),
          harness.createOverigPersoon(
            factory.overigPersoon({ achternaam: 'Nieuwe bestuurder' }),
          ),
          harness.createLocatie(
            factory.locatie({ naam: 'Nieuwe opstap', soort: 'opstapplaats' }),
          ),
          harness.createLocatie(
            factory.locatie({
              naam: 'Nieuwe bestemming',
              soort: 'cursushuis',
            }),
          ),
        ]);

      const updatedInput: UpsertableVervoerstoer & { compleet: boolean } = {
        ...created,
        projectIds: [nieuwProject.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          id: 0,
          locatie: nieuweBestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [
          {
            id: created.routes[0]!.id,
            chauffeur: nieuweChauffeur,
            vertrekadres: {
              ...factory.adres({ straatnaam: 'Nieuw vertrekstraat' }),
              id: 0,
            },
            stops: [
              {
                id: created.routes[0]!.stops[0]!.id,
                volgnummer: 10,
                locatie: nieuweLocatie,
                aanmeldersOpTePikken: [],
              },
            ],
          },
        ],
      };

      const updated = await harness.updateVervoerstoer(
        created.id,
        updatedInput,
      );

      expect(updated.id).eq(created.id);
      expect(updated.projectIds).deep.eq([nieuwProject.id]);
      expect(updated.toeTeKennenStops).lengthOf(0);
      expect(updated.bestemmingStop).to.not.be.undefined;
      expect(updated.bestemmingStop!.locatie.id).eq(nieuweBestemming.id);
      expect(updated.routes).lengthOf(1);
      expect(updated.routes[0]!.chauffeur.id).eq(nieuweChauffeur.id);
      expect(updated.routes[0]!.vertrekadres?.straatnaam).eq(
        'Nieuw vertrekstraat',
      );
      expect(updated.routes[0]!.stops).lengthOf(1);
      expect(updated.routes[0]!.stops[0]!.locatie.id).eq(nieuweLocatie.id);

      const all = await harness.get('/vervoerstoeren').expect(200);
      expect(all.body).deep.eq([updated]);
    });

    it('should add a toeTeKennenStop', async () => {
      const created = await arrangeCreatedVervoerstoer();
      const nieuweLocatie = await harness.createLocatie(
        factory.locatie({ naam: 'Nieuwe stop', soort: 'opstapplaats' }),
      );

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        toeTeKennenStops: [
          { locatie: nieuweLocatie, volgnummer: 0, aanmeldersOpTePikken: [] },
        ],
      });

      expect(updated.toeTeKennenStops).lengthOf(1);
      expect(updated.toeTeKennenStops[0]!.locatie.id).eq(nieuweLocatie.id);
    });

    it('should remove a toeTeKennenStop', async () => {
      const locatie = await harness.createLocatie(
        factory.locatie({ naam: 'Te verwijderen', soort: 'opstapplaats' }),
      );
      const base = await arrangeVervoerstoer();
      base.toeTeKennenStops = [
        { locatie, volgnummer: 0, aanmeldersOpTePikken: [] },
      ];
      const created = await harness.createVervoerstoer(base);
      expect(created.toeTeKennenStops).lengthOf(1);

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        toeTeKennenStops: [],
      });

      expect(updated.toeTeKennenStops).lengthOf(0);
    });

    it('should update a toeTeKennenStop with new aanmeldingen', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'StopDeelnemer' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const locatie = await harness.createLocatie(
        factory.locatie({ naam: 'Stop', soort: 'opstapplaats' }),
      );
      const bestemming = await harness.createLocatie(
        factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
      );
      const chauffeur = await harness.createOverigPersoon(
        factory.overigPersoon({ achternaam: 'Chauffeur' }),
      );
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [
          { locatie, volgnummer: 0, aanmeldersOpTePikken: [] },
        ],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [{ chauffeur, stops: [] }],
      });
      expect(created.toeTeKennenStops[0]!.aanmeldersOpTePikken).lengthOf(0);

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        toeTeKennenStops: [
          {
            ...created.toeTeKennenStops[0]!,
            aanmeldersOpTePikken: [aanmelding],
          },
        ],
      });

      expect(updated.toeTeKennenStops[0]!.aanmeldersOpTePikken).lengthOf(1);
      expect(updated.toeTeKennenStops[0]!.aanmeldersOpTePikken[0]!.id).eq(
        aanmelding.id,
      );
    });

    it('should add a route', async () => {
      const created = await arrangeCreatedVervoerstoer();
      const nieuweChauffeur = await harness.createOverigPersoon(
        factory.overigPersoon({ achternaam: 'Extra chauffeur' }),
      );

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        routes: [...created.routes, { chauffeur: nieuweChauffeur, stops: [] }],
      });

      expect(updated.routes).lengthOf(2);
    });

    it('should remove a route', async () => {
      const created = await arrangeCreatedVervoerstoer();

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        routes: [],
      });

      expect(updated.routes).lengthOf(0);
    });

    it('should move a stop from toeTeKennen to a route', async () => {
      const locatie = await harness.createLocatie(
        factory.locatie({ naam: 'Verplaatste stop', soort: 'opstapplaats' }),
      );
      const base = await arrangeVervoerstoer();
      base.toeTeKennenStops = [
        { locatie, volgnummer: 0, aanmeldersOpTePikken: [] },
      ];
      const created = await harness.createVervoerstoer(base);
      expect(created.toeTeKennenStops).lengthOf(1);
      expect(created.routes[0]!.stops).lengthOf(2);

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        toeTeKennenStops: [],
        routes: [
          {
            ...created.routes[0]!,
            stops: [
              ...created.routes[0]!.stops,
              { locatie, volgnummer: 3, aanmeldersOpTePikken: [] },
            ],
          },
        ],
      });

      expect(updated.toeTeKennenStops).lengthOf(0);
      expect(updated.routes[0]!.stops).lengthOf(3);
      expect(updated.routes[0]!.stops[2]!.locatie.id).eq(locatie.id);
    });

    it('should add aanmeldingen to a route stop', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'RouteDeelnemer' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, locatie, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Stop', soort: 'opstapplaats' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [
          {
            chauffeur,
            stops: [{ locatie, volgnummer: 1, aanmeldersOpTePikken: [] }],
          },
        ],
      });

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        routes: [
          {
            ...created.routes[0]!,
            stops: [
              {
                ...created.routes[0]!.stops[0]!,
                aanmeldersOpTePikken: [aanmelding],
              },
            ],
          },
        ],
      });

      expect(updated.routes[0]!.stops[0]!.aanmeldersOpTePikken).lengthOf(1);
      expect(updated.routes[0]!.stops[0]!.aanmeldersOpTePikken[0]!.id).eq(
        aanmelding.id,
      );
    });

    it('should add aanmeldingen to the bestemmingStop', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'BestDeelnemer' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [{ chauffeur, stops: [] }],
      });

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        bestemmingStop: {
          ...created.bestemmingStop!,
          aanmeldersOpTePikken: [aanmelding],
        },
      });

      expect(updated.bestemmingStop!.aanmeldersOpTePikken).lengthOf(1);
      expect(updated.bestemmingStop!.aanmeldersOpTePikken[0]!.id).eq(
        aanmelding.id,
      );
    });

    it('should remove aanmeldingen from a route stop', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'Verwijder' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, locatie, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Stop', soort: 'opstapplaats' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [
          {
            chauffeur,
            stops: [
              {
                locatie,
                volgnummer: 1,
                aanmeldersOpTePikken: [aanmelding],
              },
            ],
          },
        ],
      });
      expect(created.routes[0]!.stops[0]!.aanmeldersOpTePikken).lengthOf(1);

      const updated = await harness.updateVervoerstoer(created.id, {
        ...created,
        routes: [
          {
            ...created.routes[0]!,
            stops: [
              {
                ...created.routes[0]!.stops[0]!,
                aanmeldersOpTePikken: [],
              },
            ],
          },
        ],
      });

      expect(updated.routes[0]!.stops[0]!.aanmeldersOpTePikken).lengthOf(0);
    });

    it('should be able to delete a bestemming stop', async () => {
      const project = await harness.createProject(factory.cursus());
      const bestemming = await harness.createLocatie(
        factory.locatie({ naam: 'Bestemming', soort: 'cursushuis' }),
      );
      const vervoerstoer = await harness.createVervoerstoer(
        factory.vervoerstoer({
          projectIds: [project.id],
          bestemmingStop: {
            id: 0,
            locatie: bestemming,
            volgnummer: 0,
            aanmeldersOpTePikken: [],
          },
        }),
      );
      const updated = await harness.updateVervoerstoer(vervoerstoer.id, {
        ...vervoerstoer,
        bestemmingStop: undefined,
      });

      expect(updated.bestemmingStop).to.be.undefined;
    });

    it('should be able to update without a bestemming', async () => {
      const project = await harness.createProject(factory.cursus());
      const vervoerstoer = await harness.createVervoerstoer(
        factory.vervoerstoer({
          projectIds: [project.id],
          bestemmingStop: undefined,
        }),
      );
      const updated = await harness.updateVervoerstoer(vervoerstoer.id, {
        ...vervoerstoer,
        bestemmingStop: undefined,
      });

      expect(updated.bestemmingStop).to.be.undefined;
    });
  });
  describe('compleet', () => {
    it('should not be compleet without routes', async () => {
      const vervoerstoer = await arrangeVervoerstoer();
      vervoerstoer.routes = [];
      const created = await harness.createVervoerstoer(vervoerstoer);
      expect(created.compleet).eq(false);
    });

    it('should not be compleet without all timings filled in', async () => {
      const created = await arrangeCreatedVervoerstoer();
      expect(created.compleet).eq(false);
    });

    it('should not be compleet when toeTeKennenStops have aanmeldingen', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'TestDeelnemer' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, locatie, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Stop', soort: 'opstapplaats' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [
          { locatie, volgnummer: 0, aanmeldersOpTePikken: [aanmelding] },
        ],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [{ chauffeur, stops: [] }],
      });
      expect(created.compleet).eq(false);
    });

    it('should not be compleet when not all bevestigde aanmeldingen are in stops', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'TestDeelnemer' }),
      );
      await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const now = new Date();
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [
          { chauffeur, vertrekTijd: now, vertrekTijdTerug: now, stops: [] },
        ],
      });
      expect(created.compleet).eq(false);
    });

    it('should be compleet when all conditions are met', async () => {
      const project = await harness.createProject(factory.cursus());
      const deelnemer = await harness.createDeelnemer(
        factory.deelnemer({ achternaam: 'TestDeelnemer' }),
      );
      const aanmelding = await harness.createAanmelding({
        projectId: project.id,
        status: 'Bevestigd',
        deelnemerId: deelnemer.id,
      });
      const [chauffeur, locatie, bestemming] = await Promise.all([
        harness.createOverigPersoon(
          factory.overigPersoon({ achternaam: 'Chauffeur' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Stop', soort: 'opstapplaats' }),
        ),
        harness.createLocatie(
          factory.locatie({ naam: 'Dest', soort: 'cursushuis' }),
        ),
      ]);
      const now = new Date();
      const created = await harness.createVervoerstoer({
        projectIds: [project.id],
        toeTeKennenStops: [],
        bestemmingStop: {
          locatie: bestemming,
          volgnummer: 0,
          aanmeldersOpTePikken: [],
        },
        routes: [
          {
            chauffeur,
            vertrekTijd: now,
            vertrekTijdTerug: now,
            stops: [
              {
                locatie,
                volgnummer: 1,
                aanmeldersOpTePikken: [aanmelding],
                geplandeAankomst: now,
                geplandeAankomstTerug: now,
              },
            ],
          },
        ],
      });
      expect(created.compleet).eq(true);
    });
  });
});

async function arrangeVervoerstoer(): Promise<UpsertableVervoerstoer> {
  const [projectA, projectB, chauffeur, stopA, stopB, bestemming] =
    await Promise.all([
      harness.createProject(factory.vakantie()),
      harness.createProject(factory.cursus()),
      harness.createOverigPersoon(
        factory.overigPersoon({ achternaam: 'Bestuurder A' }),
      ),
      harness.createLocatie(
        factory.locatie({ naam: 'Opstap A', soort: 'opstapplaats' }),
      ),
      harness.createLocatie(
        factory.locatie({ naam: 'Opstap B', soort: 'opstapplaats' }),
      ),
      harness.createLocatie(
        factory.locatie({ naam: 'Bestemming', soort: 'cursushuis' }),
      ),
    ]);

  return {
    projectIds: [projectA.id, projectB.id],
    toeTeKennenStops: [],
    bestemmingStop: {
      locatie: bestemming,
      volgnummer: 0,
      aanmeldersOpTePikken: [],
    },
    routes: [
      {
        chauffeur,
        vertrekadres: {
          ...factory.adres({ straatnaam: 'Vertrekstraat' }),
          id: 0,
        },
        stops: [
          { volgnummer: 1, locatie: stopA, aanmeldersOpTePikken: [] },
          { volgnummer: 2, locatie: stopB, aanmeldersOpTePikken: [] },
        ],
      },
    ],
  };
}

async function arrangeCreatedVervoerstoer(): Promise<Vervoerstoer> {
  return harness.createVervoerstoer(await arrangeVervoerstoer());
}
