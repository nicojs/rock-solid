import { loginUrl } from '@rock-solid/shared';
import { authStore, AuthStore } from '../auth';
import { HttpStatus } from './http-status';

export class HttpClient {
  constructor(private auth: AuthStore = authStore) {
    auth.jwt$.subscribe((jwt) => {
      this.currentJwt = jwt;
    });
  }

  private currentJwt: string | undefined;

  public async fetch(
    input: RequestInfo,
    init?: RequestInit | undefined,
  ): Promise<Response> {
    if (this.currentJwt) {
      init = init ?? {};
      const authorizationValue = `Bearer ${this.currentJwt}`;
      const authorizationKey = 'Authorization';
      const headers = (init.headers = init.headers ?? {});
      if (Array.isArray(headers)) {
        headers.push([authorizationKey, authorizationValue]);
      } else if (headers instanceof Headers) {
        headers.append(authorizationKey, authorizationValue);
      } else {
        headers[authorizationKey] = authorizationValue;
      }
    }
    const response = await fetch(input, init);
    if (response.status === HttpStatus.UNAUTHORIZED) {
      // Clear old JWT
      this.auth.logoff();

      // Redirect to login page
      window.location.href = loginUrl;
    }
    return response;
  }
}

export const httpClient = new HttpClient();

export function toQueryString(query: object | undefined) {
  if (query) {
    return `?${Object.entries(query)
      .filter(
        ([, val]) =>
          val !== undefined &&
          val !== '' &&
          val !== false &&
          (!Array.isArray(val) || val.length > 0),
      )
      .map(
        ([key, val]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
      )
      .join('&')}`;
  }
  return '';
}
