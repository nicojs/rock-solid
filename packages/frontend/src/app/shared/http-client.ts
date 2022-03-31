import { loginUrl } from '@kei-crm/shared';
import { authService, AuthService } from '../auth';
import { HttpStatus } from './http-status';

export class HttpClient {
  constructor(auth: AuthService = authService) {
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
      console.log(`Add auth to ${input}`);
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
      // Redirect to login page
      window.location.href = loginUrl;
    }
    return response;
  }
}

export const httpClient = new HttpClient();
