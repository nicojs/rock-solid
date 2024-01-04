import { logoutUrl, User, userRoleNames } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { bootstrap } from '../../styles';
import { authStore } from './auth.store';

@customElement('rock-user')
export class UserComponent extends LitElement {
  public static override styles = [bootstrap];

  private sub = new Subscription();
  @state()
  private user?: User;

  public logoff(event: MouseEvent) {
    event.preventDefault();
    authStore.logoff();
    window.location.href = logoutUrl;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.sub.add(authStore.user$.subscribe((user) => (this.user = user)));
  }

  protected override render() {
    return html` <nav class="navbar navbar-light bg-light">
      Ingelogd als
      ${this.user
        ? `${this.user.name} (${userRoleNames[this.user.role]})`
        : 'gast'}${this.user
        ? html`&nbsp;<a class="text-reset" href="#" @click=${this.logoff}
              >uitloggen</a
            >`
        : ''}
    </nav>`;
  }
}
