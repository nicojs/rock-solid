import { Persoon, PersoonFilter, UpsertablePersoon } from '@kei-crm/shared';
import { Page, restClient, RestClient } from '../shared/rest-client';

export class PersoonService {
  constructor(private restClient: RestClient) {}

  getAll(query?: PersoonFilter): Promise<Persoon[]> {
    return this.restClient.getAll(
      'personen',
      query as Record<string, unknown> | undefined,
    );
  }

  getPage(page = 0, query?: PersoonFilter): Promise<Page<'personen'>> {
    return this.restClient.getPage(
      'personen',
      page,
      query as Record<string, unknown> | undefined,
    );
  }
  get(id: string | number): Promise<Persoon> {
    return this.restClient.getOne('personen', id);
  }

  update(id: string | number, persoon: UpsertablePersoon): Promise<void> {
    return this.restClient.update('personen', id, persoon);
  }

  create(persoon: UpsertablePersoon): Promise<Persoon> {
    return this.restClient.create('personen', persoon);
  }
}

export const persoonService = new PersoonService(restClient);
