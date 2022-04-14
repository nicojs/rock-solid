import { User } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { bootstrap } from '../../styles';
import { authService } from './auth.service';

@customElement('rock-user')
export class UserComponent extends LitElement {
  public static override styles = [bootstrap];

  private sub = new Subscription();
  @state()
  private user?: User;

  public logoff(event: MouseEvent) {
    event.preventDefault();
    authService.logoff();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.sub.add(authService.user$.subscribe((user) => (this.user = user)));
  }

  protected override render() {
    return html` <nav class="navbar navbar-light bg-light">
      Ingelogd als
      ${this.user ? `${this.user.name} (${this.user.email})` : 'gast'}${this
        .user
        ? html`&nbsp;<a class="text-reset" href="#" @click=${this.logoff}
              >uitloggen</a
            >`
        : ''}
    </nav>`;
  }
}
