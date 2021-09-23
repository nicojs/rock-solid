import { Persoon } from '@kei-crm/shared';
import { restClient, RestClient } from '../shared/rest-client';

export class PersoonService {
  constructor(private restClient: RestClient) {}

  getAll(): Promise<Persoon[]> {
    return this.restClient.getAll('personen');
  }

  get(id: string): Promise<Persoon> {
    return this.restClient.getOne('personen', id);
  }
}

export const persoonService = new PersoonService(restClient);
