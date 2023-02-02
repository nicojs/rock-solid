import {
  Deelname,
  ProjectReport,
  OrganisatieFilter,
  PersoonFilter,
  AanmeldingenReportType,
  UpsertableDeelname,
  UpsertableAanmelding,
} from './index.js';
import { Aanmelding } from './aanmelding.js';
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
  ProjectenAanmeldingRoute &
  ActiviteitDeelnamesRoute &
  PersoonAanmeldingenRoute &
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

type ProjectenAanmeldingRoute = {
  [K in `projecten/${string}/aanmeldingen`]: {
    entity: Aanmelding;
    upsertableEntity: UpsertableAanmelding;
    filter: Omit<ProjectFilter, 'aanmeldingPersoonId'>;
  };
};

type PersoonAanmeldingenRoute = {
  [K in `personen/${string}/aanmeldingen`]: {
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
  [K in `reports/aanmeldingen/${AanmeldingenReportType}`]: {
    entity: ProjectReport;
  };
};

export const TOTAL_COUNT_HEADER = 'X-Total-Count';
