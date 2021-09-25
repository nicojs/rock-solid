import { RestRoutes } from '@kei-crm/shared';
import { HttpStatus } from './http-status';

export class RestClient {
  async getAll<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
  ): Promise<RestRoutes[TEntityName]['entity'][]> {
    const response = await fetch(`/api/${entityName}`);
    return response.json();
  }

  async getOne<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
    id: string,
  ): Promise<RestRoutes[TEntityName]['entity']> {
    const response = await fetch(`/api/${entityName}/${id}`);
    return response.json();
  }

  async update<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
    id: string,
    entity: RestRoutes[TEntityName]['upsertableEntity'],
  ): Promise<void> {
    const response = await fetch(`/api/${entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entity),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.status !== HttpStatus.NO_CONTENT) {
      throw new Error(`Update failed (HTTP status code ${response.status})`);
    }
  }

  async create<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
    entity: RestRoutes[TEntityName]['upsertableEntity'],
  ): Promise<RestRoutes[TEntityName]['entity']> {
    const response = await fetch(`/api/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(entity),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.status !== HttpStatus.CREATED) {
      throw new Error(`Create failed (HTTP status code ${response.status})`);
    }
    return response.json();
  }
}

export const restClient = new RestClient();
