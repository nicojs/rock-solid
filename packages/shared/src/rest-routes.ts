import { UpsertableInschrijving } from '.';
import { Inschrijving } from './inschrijving';
import { Persoon, UpsertablePersoon } from './persoon';
import { Project, UpsertableProject } from './project';

export type RestRoutes = TopRoutes & ProjectenInschrijvingRoute;

type TopRoutes = {
  personen: {
    entity: Persoon;
    upsertableEntity: UpsertablePersoon;
  };
  projecten: {
    entity: Project;
    upsertableEntity: UpsertableProject;
  };
};

type ProjectenInschrijvingRoute = {
  [K in `projecten/${string}/inschrijvingen`]: {
    entity: Inschrijving;
    upsertableEntity: UpsertableInschrijving;
  };
};
