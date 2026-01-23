import { Plaats } from '@rock-solid/shared';
import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

class PlaatsService extends RestService<'plaatsen'> {
  async batchUpdate(
    plaatsen: Pick<Plaats, 'deelgemeente' | 'gemeente' | 'postcode'>[],
  ): Promise<void> {
    await this.restClient.http.fetch(`/api/${this.route}`, {
      body: JSON.stringify(plaatsen),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const plaatsService = new PlaatsService(restClient, 'plaatsen');
