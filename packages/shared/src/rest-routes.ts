import { Deelname, UpsertableDeelname, UpsertableInschrijving } from '.';
import { Inschrijving } from './inschrijving';
import { Persoon, UpsertablePersoon } from './persoon';
import { Project, UpsertableProject } from './project';

export type RestRoutes = TopRoutes &
  ProjectenInschrijvingRoute &
  ActiviteitDeelnamesRoute;

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

type ActiviteitDeelnamesRoute = {
  [K in `projecten/${string}/activiteiten/${string}/deelnames`]: {
    entity: Deelname;
    upsertableEntity: UpsertableDeelname;
  };
};

export const TOTAL_COUNT_HEADER = 'X-Total-Count';
