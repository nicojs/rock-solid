import { parse, RestRoutes } from '@kei-crm/shared';
import { HttpStatus } from './http-status';

export class RestClient {
  async getAll<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
    query?: Record<string, unknown>,
  ): Promise<RestRoutes[TEntityName]['entity'][]> {
    const response = await fetch(`/api/${entityName}${toQueryString(query)}`);
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async getOne<TEntityName extends keyof RestRoutes>(
    entityName: TEntityName,
    id: string,
  ): Promise<RestRoutes[TEntityName]['entity']> {
    const response = await fetch(`/api/${entityName}/${id}`);
    const bodyText = await response.text();
    return parse(bodyText);
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
    const bodyText = await response.text();
    return parse(bodyText);
  }
}

export const restClient = new RestClient();

function toQueryString(query: Record<string, unknown> | undefined) {
  if (query) {
    return `?${Object.entries(query)
      .map(
        ([key, val]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      )
      .join('&')}`;
  }
  return '';
}
