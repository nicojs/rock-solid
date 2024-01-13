import { loginUrl, UnprocessableEntityBody } from '@rock-solid/shared';
import { authStore, AuthStore } from '../auth';
import { InternalError, UniquenessFailedError } from './errors';
import { HttpStatus } from './http-status';
import { ModalComponent } from './modal.component';
import { html } from 'lit';

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
    if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
      const body: UnprocessableEntityBody<unknown> = await response.json();
      switch (body.status) {
        case 'uniqueness_failed':
          throw new UniquenessFailedError(body.fields);
      }
    }
    if (response.status >= 500) {
      const responseText = await response.text();
      const technicalDetails = `Status: ${response.status}. Response: ${responseText}`;
      ModalComponent.instance.alert(
        html`<rock-technical-error-message
          .technicalDetails=${technicalDetails}
        ></rock-technical-error-message>`,
        'Fout opgetreden',
      );
      throw new InternalError(technicalDetails);
    }
    return response;
  }
}

export const httpClient = new HttpClient();
