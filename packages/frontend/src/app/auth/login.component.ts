import { LoginResponse, loginUrl } from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { router } from '../router';
import { httpClient } from '../shared/http-client';
import { authService } from './auth.service';

@customElement('kei-login')
export class LoginComponent extends LitElement {
  @property()
  public queryString!: string;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.queryString) {
      httpClient
        .fetch(`${loginUrl}${this.queryString}`)
        .then((resp) => resp.json())
        .then((login: LoginResponse) => {
          authService.login(login);
          router.navigate('/');
        });
    } else {
      window.location.href = loginUrl;
    }
  }

  protected override render() {
    return html`<div>Loading</div>`;
  }
}
