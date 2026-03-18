import { parse, UpsertableVervoerstoer, Vervoerstoer } from '@rock-solid/shared';
import { httpClient } from '../shared/http-client';

class VervoerstoerService {
  async getAll(): Promise<Vervoerstoer[]> {
    const response = await httpClient.fetch('/api/vervoerstoeren');
    return parse(await response.text());
  }

  async get(id: number): Promise<Vervoerstoer> {
    const response = await httpClient.fetch(`/api/vervoerstoeren/${id}`);
    return parse(await response.text());
  }

  async create(v: UpsertableVervoerstoer): Promise<Vervoerstoer> {
    const response = await httpClient.fetch('/api/vervoerstoeren', {
      method: 'POST',
      body: JSON.stringify(v),
      headers: { 'Content-Type': 'application/json' },
    });
    return parse(await response.text());
  }

  async update(v: UpsertableVervoerstoer & { id: number }): Promise<Vervoerstoer> {
    const response = await httpClient.fetch(`/api/vervoerstoeren/${v.id}`, {
      method: 'PUT',
      body: JSON.stringify(v),
      headers: { 'Content-Type': 'application/json' },
    });
    return parse(await response.text());
  }

  async getReistijd(
    origin: string,
    destination: string,
    aankomstTijd?: Date,
  ): Promise<{ minSeconds: number | null; maxSeconds: number | null; reason?: string }> {
    const params = new URLSearchParams({ origin, destination });
    if (aankomstTijd !== undefined) {
      params.set('aankomstTijd', aankomstTijd.toISOString());
    }
    const response = await httpClient.fetch(
      `/api/google-maps/reistijd?${params.toString()}`,
    );
    return response.json();
  }
}

export const vervoerstoerService = new VervoerstoerService();
