import type { PatchablePersoon, Persoon } from '@rock-solid/shared';
import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

class PersoonService extends RestService<'personen'> {

  constructor() {
    super(restClient, 'personen');
  }

  patchPersoon(persoonId: number, persoon: PatchablePersoon): Promise<Persoon> {
    return this.restClient.patch('personen', persoonId, persoon);
  }
}

export const persoonService = new PersoonService();
