import {
  Inschrijving,
  Project,
  UpsertableInschrijving,
  UpsertableProject,
} from '@kei-crm/shared';
import { restClient, RestClient } from '../shared/rest-client';

export class ProjectService {
  constructor(private restClient: RestClient) {}

  getAll(query: Partial<Project>): Promise<Project[]> {
    return this.restClient.getAll('projecten', query);
  }

  get(id: string | number): Promise<Project> {
    return this.restClient.getOne('projecten', id);
  }

  getInschrijvingen(projectId: number | string): Promise<Inschrijving[]> {
    return this.restClient.getAll(`projecten/${projectId}/inschrijvingen`);
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
}

export const projectService = new ProjectService(restClient);
