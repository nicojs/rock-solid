import {
  Deelname,
  Aanmelding,
  UpsertableDeelname,
  UpsertableAanmelding,
} from '@rock-solid/shared';
import { restClient, RestClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export class ProjectService extends RestService<'projecten'> {
  constructor(restClient: RestClient) {
    super(restClient, 'projecten');
  }

  getAanmeldingen(projectId: number | string): Promise<Aanmelding[]> {
    return this.restClient.getAll(`projecten/${projectId}/aanmeldingen`);
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

  createAanmelding(
    projectId: number | string,
    aanmelding: UpsertableAanmelding,
  ): Promise<Aanmelding> {
    return this.restClient.create(
      `projecten/${projectId}/aanmeldingen`,
      aanmelding,
    );
  }

  updateAanmelding(
    projectId: number | string,
    aanmelding: Aanmelding,
  ): Promise<Aanmelding> {
    return this.restClient.update(
      `projecten/${projectId}/aanmeldingen`,
      aanmelding.id,
      aanmelding,
    );
  }

  patchAanmelding(
    projectId: number | string,
    aanmeldingId: number,
    aanmelding: Partial<Aanmelding>,
  ): Promise<Aanmelding> {
    return this.restClient.patch(
      `projecten/${projectId}/aanmeldingen`,
      aanmeldingId,
      aanmelding,
    );
  }
}

export const projectService = new ProjectService(restClient);
