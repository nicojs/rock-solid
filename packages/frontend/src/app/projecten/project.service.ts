import { Project, UpsertableProject } from '@kei-crm/shared';
import { restClient, RestClient } from '../shared/rest-client';

export class ProjectService {
  constructor(private restClient: RestClient) {}

  getAll(): Promise<Project[]> {
    return this.restClient.getAll('projecten');
  }

  get(id: string): Promise<Project> {
    return this.restClient.getOne('projecten', id);
  }

  update(id: string, project: UpsertableProject): Promise<void> {
    return this.restClient.update('projecten', id, project);
  }

  create(project: UpsertableProject): Promise<Project> {
    return this.restClient.create('projecten', project);
  }
}

export const projectService = new ProjectService(restClient);
