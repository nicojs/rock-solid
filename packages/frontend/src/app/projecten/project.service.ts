import {
  Deelname,
  Inschrijving,
  UpsertableDeelname,
  UpsertableInschrijving,
} from '@rock-solid/shared';
import { restClient, RestClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export class ProjectService extends RestService<'projecten'> {
  constructor(restClient: RestClient) {
    super(restClient, 'projecten');
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
  ): Promise<Inschrijving> {
    return this.restClient.update(
      `projecten/${projectId}/inschrijvingen`,
      inschrijving.id,
      inschrijving,
    );
  }
}

export const projectService = new ProjectService(restClient);
