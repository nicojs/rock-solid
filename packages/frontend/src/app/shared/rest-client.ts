import { parse, RestRoutes, TOTAL_COUNT_HEADER } from '@rock-solid/shared';
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
    query?: Record<string, unknown>,
  ): Promise<RestRoutes[TRoute]['entity'][]> {
    const response = await this.http.fetch(
      `/api/${route}${toQueryString(query)}`,
    );
    const bodyText = await response.text();
    return parse(bodyText);
  }

  async getPage<TRoute extends keyof RestRoutes>(
    route: TRoute,
    page = 0,
    query: Record<string, unknown> = {},
  ): Promise<Page<TRoute>> {
    query['_page'] = page;
    const response = await this.http.fetch(
      `/api/${route}${toQueryString(query)}`,
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
    if (response.status !== HttpStatus.NO_CONTENT) {
      throw new Error(`Update failed (HTTP status code ${response.status})`);
    }
  }

  async update<TRoute extends keyof RestRoutes>(
    route: TRoute,
    id: string | number,
    entity: RestRoutes[TRoute]['upsertableEntity'],
  ): Promise<void> {
    const response = await this.http.fetch(`/api/${route}/${id}`, {
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

function toQueryString(query: Record<string, unknown> | undefined) {
  if (query) {
    return `?${Object.entries(query)
      .filter(([, val]) => val !== '')
      .map(
        ([key, val]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      )
      .join('&')}`;
  }
  return '';
}
