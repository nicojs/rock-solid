import { RestRoutes } from '@kei-crm/shared';

export class RestClient {
  async getAll<TEntityName extends keyof RestRoutes>(
    entity: TEntityName,
  ): Promise<RestRoutes[TEntityName][]> {
    const response = await fetch(`/api/${entity}`);
    return response.json();
  }

  async getOne<TEntityName extends keyof RestRoutes>(
    entity: TEntityName,
    id: string,
  ): Promise<RestRoutes[TEntityName]> {
    const response = await fetch(`/api/${entity}/${id}`);
    return response.json();
  }
}

export const restClient = new RestClient();
