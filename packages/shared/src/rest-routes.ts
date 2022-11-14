import {
  Deelname,
  ProjectReport,
  OrganisatieFilter,
  PersoonFilter,
  InschrijvingenReportType,
  UpsertableDeelname,
  UpsertableInschrijving,
} from './index.js';
import { Inschrijving } from './inschrijving.js';
import { Organisatie, UpsertableOrganisatie } from './organisatie.js';
import { Persoon, UpsertablePersoon } from './persoon.js';
import { Plaats, PlaatsFilter } from './adres.js';
import { Project, ProjectFilter, UpsertableProject } from './project.js';

export type EntityFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['entity'];
export type UpsertableFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['upsertableEntity'];
export type FilterFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['filter'];

export type RestRoutes = TopRoutes &
  ProjectenInschrijvingRoute &
  ActiviteitDeelnamesRoute &
  PersoonInschrijvingenRoute &
  PersoonBegeleidRoute;

type TopRoutes = {
  personen: {
    entity: Persoon;
    upsertableEntity: UpsertablePersoon;
    filter: PersoonFilter;
  };
  projecten: {
    entity: Project;
    upsertableEntity: UpsertableProject;
    filter: ProjectFilter;
  };
  organisaties: {
    entity: Organisatie;
    upsertableEntity: UpsertableOrganisatie;
    filter: OrganisatieFilter;
  };
  plaatsen: {
    entity: Plaats;
    upsertableEntity: Plaats;
    filter: PlaatsFilter;
  };
};

type ProjectenInschrijvingRoute = {
  [K in `projecten/${string}/inschrijvingen`]: {
    entity: Inschrijving;
    upsertableEntity: UpsertableInschrijving;
    filter: Omit<ProjectFilter, 'inschrijvingPersoonId'>;
  };
};

type PersoonInschrijvingenRoute = {
  [K in `personen/${string}/inschrijvingen`]: {
    entity: Project;
    filter: ProjectFilter;
    upsertableEntity: never;
  };
};
type PersoonBegeleidRoute = {
  [K in `personen/${string}/begeleid`]: {
    entity: Project;
    filter: ProjectFilter;
    upsertableEntity: never;
  };
};

type ActiviteitDeelnamesRoute = {
  [K in `projecten/${string}/activiteiten/${string}/deelnames`]: {
    entity: Deelname;
    upsertableEntity: UpsertableDeelname;
    filter: Record<string, never>;
  };
};

export type ReportRoutes = {
  [K in `reports/inschrijvingen/${InschrijvingenReportType}`]: {
    entity: ProjectReport;
  };
};

export const TOTAL_COUNT_HEADER = 'X-Total-Count';
