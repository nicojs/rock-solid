import { BasePersoon, UpsertablePersoon } from '@kei-crm/shared';
import { restClient, RestClient } from '../shared/rest-client';

export class PersoonService {
  constructor(private restClient: RestClient) {}

  getAll(): Promise<BasePersoon[]> {
    return this.restClient.getAll('personen');
  }

  get(id: string): Promise<BasePersoon> {
    return this.restClient.getOne('personen', id);
  }

  update(id: string, persoon: UpsertablePersoon): Promise<void> {
    return this.restClient.update('personen', id, persoon);
  }

  create(persoon: UpsertablePersoon): Promise<BasePersoon> {
    return this.restClient.create('personen', persoon);
  }
}

export const persoonService = new PersoonService(restClient);
