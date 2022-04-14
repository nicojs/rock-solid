import {
  EntityFrom,
  FilterFrom,
  RestRoutes,
  UpsertableFrom,
} from '@rock-solid/shared';
import { Page, RestClient } from './rest-client';

export class RestService<TRoute extends keyof RestRoutes> {
  constructor(private restClient: RestClient, private route: TRoute) {}

  getAll(query?: FilterFrom<TRoute>): Promise<EntityFrom<TRoute>[]> {
    return this.restClient.getAll(
      this.route,
      query as Record<string, unknown> | undefined,
    );
  }

  getPage(page = 0, query?: FilterFrom<TRoute>): Promise<Page<TRoute>> {
    return this.restClient.getPage(
      this.route,
      page,
      query as Record<string, unknown> | undefined,
    );
  }
  get(id: string | number): Promise<EntityFrom<TRoute>> {
    return this.restClient.getOne(this.route, id);
  }

  update(id: string | number, data: UpsertableFrom<TRoute>): Promise<void> {
    return this.restClient.update(this.route, id, data);
  }

  create(data: UpsertableFrom<TRoute>): Promise<EntityFrom<TRoute>> {
    return this.restClient.create(this.route, data);
  }
}
