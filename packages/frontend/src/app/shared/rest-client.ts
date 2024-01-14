import {
  EntityFrom,
  FilterFrom,
  PAGE_QUERY_STRING_NAME,
  parse,
  Patchable,
  Query,
  RestRoutes,
  TOTAL_COUNT_HEADER,
} from '@rock-solid/shared';
import { httpClient, HttpClient } from './http-client';
import { HttpStatus } from './http-status';

export interface Page<TRoute extends keyof RestRoutes> {
  totalCount: number;
  items: RestRoutes[TRoute]['entity'][];
}

export class RestClient {
  constructor(private http: HttpClient = httpClient) {}

  async getAll<TRoute extends keyof RestRoutes>(
    route: TRoute,
    filter?: FilterFrom<TRoute>,
  ): Promise<EntityFrom<TRoute>[]> {
    const response = await this.http.fetch(
      `/api/${route}${toQueryString(filter)}`,
    );
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async getPage<TRoute extends keyof RestRoutes>(
    route: TRoute,
    page = 0,
    filter?: FilterFrom<TRoute>,
    signal?: AbortSignal,
  ): Promise<Page<TRoute>> {
    const query = { ...filter, [PAGE_QUERY_STRING_NAME]: page };
    const response = await this.http.fetch(
      `/api/${route}${toQueryString(query)}`,
      { signal },
    );
    const bodyText = await response.text();
    const totalCount = response.headers.get(TOTAL_COUNT_HEADER);
    if (totalCount === null) {
      throw new Error(`${TOTAL_COUNT_HEADER} header was missing from ${route}`);
    }
    return {
      items: parse(bodyText),
      totalCount: +totalCount,
    };
  }

  async getOne<TRoute extends keyof RestRoutes>(
    route: TRoute,
    id: string | number,
  ): Promise<RestRoutes[TRoute]['entity']> {
    const response = await this.http.fetch(`/api/${route}/${id}`);
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async updateAll<TRoute extends keyof RestRoutes>(
    route: TRoute,
    entity: RestRoutes[TRoute]['upsertableEntity'][],
  ): Promise<void> {
    const response = await this.http.fetch(`/api/${route}`, {
      method: 'PUT',
      body: JSON.stringify(entity),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Update failed (HTTP status code ${response.status})`);
    }
  }

  async update<TRoute extends keyof RestRoutes>(
    route: TRoute,
    id: string | number,
    entity: RestRoutes[TRoute]['entity'],
  ): Promise<RestRoutes[TRoute]['entity']> {
    const response = await this.http.fetch(`/api/${route}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entity),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Update failed (HTTP status code ${response.status})`);
    }
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async delete<TRoute extends keyof RestRoutes>(
    route: TRoute,
    id: string | number,
  ): Promise<void> {
    const response = await this.http.fetch(`/api/${route}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Delete failed (HTTP status code ${response.status})`);
    }
  }

  async patch<TRoute extends keyof RestRoutes>(
    route: TRoute,
    id: string | number,
    patches: Partial<RestRoutes[TRoute]['entity']>,
  ): Promise<RestRoutes[TRoute]['entity']> {
    const response = await this.http.fetch(`/api/${route}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patches),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Patch failed (HTTP status code ${response.status})`);
    }
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async patchAll<TRoute extends keyof RestRoutes>(
    route: TRoute,
    patches: (Patchable<RestRoutes[TRoute]['entity']> & {
      id: string | number;
    })[],
  ): Promise<RestRoutes[TRoute]['entity'][]> {
    const response = await this.http.fetch(`/api/${route}`, {
      method: 'PATCH',
      body: JSON.stringify(patches),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Patch failed (HTTP status code ${response.status})`);
    }
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async create<TRoute extends keyof RestRoutes>(
    route: TRoute,
    entity: RestRoutes[TRoute]['upsertableEntity'],
  ): Promise<RestRoutes[TRoute]['entity']> {
    const response = await this.http.fetch(`/api/${route}`, {
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

function toQueryEntries(filter: object | undefined): [string, string][] {
  if (!filter) {
    return [];
  }
  return Object.entries(filter)
    .filter(
      ([, val]) =>
        val !== undefined &&
        val !== '' &&
        (!Array.isArray(val) || val.length > 0),
    )
    .map(([key, val]) => [key, String(val)]);
}

export function toQuery(filter: object | undefined): Query {
  return Object.fromEntries(toQueryEntries(filter));
}

function toQueryString(query: object | undefined) {
  if (query) {
    return `?${toQueryEntries(query)
      .map(
        ([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`,
      )
      .join('&')}`;
  }
  return '';
}
