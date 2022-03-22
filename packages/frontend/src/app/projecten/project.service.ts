import {
  Deelname,
  Inschrijving,
  Project,
  ProjectFilter,
  UpsertableDeelname,
  UpsertableInschrijving,
  UpsertableProject,
} from '@kei-crm/shared';
import { restClient, RestClient } from '../shared/rest-client';

export class ProjectService {
  constructor(private restClient: RestClient) {}

  getAll(query: ProjectFilter): Promise<Project[]> {
    return this.restClient.getAll('projecten', query);
  }

  get(id: string | number): Promise<Project> {
    return this.restClient.getOne('projecten', id);
  }

  getInschrijvingen(projectId: number | string): Promise<Inschrijving[]> {
    return this.restClient.getAll(`projecten/${projectId}/inschrijvingen`);
  }

  updateDeelnames(
    projectId: number,
    activiteitId: number,
    deelnames: UpsertableDeelname[],
  ): Promise<void> {
    return this.restClient.updateAll(
      `projecten/${projectId}/activiteiten/${activiteitId}/deelnames`,
      deelnames,
    );
  }

  getDeelnames(projectId: number, activiteitId: number): Promise<Deelname[]> {
    return this.restClient.getAll(
      `projecten/${projectId}/activiteiten/${activiteitId}/deelnames`,
    );
  }

  update(id: string | number, project: UpsertableProject): Promise<void> {
    return this.restClient.update('projecten', id, project);
  }

  create(project: UpsertableProject): Promise<Project> {
    return this.restClient.create('projecten', project);
  }

  createInschrijving(
    projectId: number | string,
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    return this.restClient.create(
      `projecten/${projectId}/inschrijvingen`,
      inschrijving,
    );
  }

  updateInschrijving(
    projectId: number | string,
    inschrijving: Inschrijving,
  ): Promise<void> {
    return this.restClient.update(
      `projecten/${projectId}/inschrijvingen`,
      inschrijving.id,
      inschrijving,
    );
  }
}

export const projectService = new ProjectService(restClient);
