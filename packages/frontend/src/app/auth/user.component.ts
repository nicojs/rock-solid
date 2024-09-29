import { logoutUrl, User, userRoleNames } from '@rock-solid/shared';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { authStore } from './auth.store';
import { RockElement } from '../rock-element';

@customElement('rock-user')
export class UserComponent extends RockElement {
  public static override styles = [bootstrap];

  @state()
  private user?: User;

  public logoff(event: MouseEvent) {
    event.preventDefault();
    authStore.logoff();
    window.location.href = logoutUrl;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      authStore.user$.subscribe((user) => (this.user = user)),
    );
  }

  protected override render() {
    return html` <nav class="navbar bg-body-tertiary">
      Ingelogd als
      ${this.user
        ? `${this.user.name} (${userRoleNames[this.user.role]})`
        : 'gast'}${this.user
        ? html`&nbsp;<a
              class="text-reset"
              href="#"
              @click=${(event: MouseEvent) => this.logoff(event)}
              >uitloggen</a
            >`
        : ''}
    </nav>`;
  }
}
