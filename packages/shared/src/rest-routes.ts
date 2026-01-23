import {
  Deelname,
  Report,
  OrganisatieFilter,
  PersoonFilter,
  AanmeldingReportType,
  UpsertableDeelname,
  InsertableAanmelding,
  ActiviteitReportType,
  AanmeldingReportFilter,
  ActiviteitReportFilter,
  AanmeldingGroupField,
  ActiviteitGroupField,
  Locatie,
  UpsertableLocatie,
  LocatieFilter,
  Plaats,
  PlaatsFilter,
} from './index.js';
import { Aanmelding, PatchableAanmelding } from './aanmelding.js';
import { Organisatie, UpsertableOrganisatie } from './organisatie.js';
import { PatchablePersoon, Persoon, UpsertablePersoon } from './persoon.js';
import {
  AanmeldingOf,
  Project,
  ProjectFilter,
  UpsertableProject,
} from './project.js';

export type EntityFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['entity'];
export type UpsertableFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['upsertableEntity'];
export type FilterFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute]['filter'];
export type PatchableFrom<TRoute extends keyof RestRoutes> =
  RestRoutes[TRoute] extends { patchableEntity: infer P } ? P : never;

export type RestRoutes = TopRoutes &
  ProjectenAanmeldingRoute &
  ActiviteitDeelnamesRoute &
  PersoonAanmeldingenRoute &
  PersoonBegeleidRoute;

type TopRoutes = {
  personen: {
    entity: Persoon;
    upsertableEntity: UpsertablePersoon;
    patchableEntity: PatchablePersoon;
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
  locaties: {
    entity: Locatie;
    upsertableEntity: UpsertableLocatie;
    filter: LocatieFilter;
  };
};

type ProjectenAanmeldingRoute = {
  [K in `projecten/${string}/aanmeldingen`]: {
    entity: Aanmelding;
    upsertableEntity: InsertableAanmelding;
    filter: Omit<ProjectFilter, 'aanmeldingPersoonId'>;
    patchableEntity: PatchableAanmelding;
  };
};

type PersoonAanmeldingenRoute = {
  [K in `personen/${string}/aanmeldingen`]: {
    entity: AanmeldingOf<Project>;
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

export type ReportRoutes = AanmeldingReportRoutes & ActiviteitReportRoutes;
export type AanmeldingReportRoutes = {
  [K in `reports/aanmeldingen/${AanmeldingReportType}`]: {
    entity: Report;
    filter: AanmeldingReportFilter;
    grouping: AanmeldingGroupField;
  };
};
export type ActiviteitReportRoutes = {
  [K in `reports/activiteiten/${ActiviteitReportType}`]: {
    entity: Report;
    filter: ActiviteitReportFilter;
    grouping: ActiviteitGroupField;
  };
};

export const TOTAL_COUNT_HEADER = 'X-Total-Count';
