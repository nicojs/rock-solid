import { Subscription } from 'rxjs';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { router, RouteParams } from '../router';
import { bootstrap } from '../../styles';
import style from './app.component.scss';
import { PersoonType } from '@kei-crm/shared';

@customElement('kei-crm-app')
export class KeiCrmApp extends LitElement {
  public static override styles = [bootstrap, unsafeCSS(style)];

  private sub?: Subscription;

  override connectedCallback() {
    super.connectedCallback();
    this.sub = router.routeChange$.subscribe((route) => (this.route = route));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.sub?.unsubscribe();
  }

  @property()
  public route?: RouteParams;

  @property()
  public params?: Record<string, string>;

  @property()
  public query?: Record<string, string>;

  public override render() {
    return html` <div class="container-fluid">
      <h1 class="display-1">KEI CRM 🤘</h1>
      <div class="d-flex align-items-start">
        <kei-nav
          class="flex-column me-3"
          .active="${this.route?.path[0]}"
        ></kei-nav>
        <main style="flex-basis: 100%">${this.renderMain()}</main>
      </div>
    </div>`;
  }

  private renderMain() {
    switch (this.route?.path[0]) {
      case 'cursussen':
        return html`<h2>Cursussen</h2>`;
      case 'vrijwilligers':
      case 'deelnemers':
        const persoonType: PersoonType =
          this.route?.path[0] === 'deelnemers' ? 'deelnemer' : 'vrijwilliger';
        switch (this.route.path[1]) {
          case 'edit':
            return html`<kei-personen-edit
              entityId="${this.route.path[2]}"
              type="${persoonType}"
            ></kei-personen-edit>`;
          case 'new':
            return html`<kei-personen-edit
              type="${persoonType}"
            ></kei-personen-edit>`;
          default:
            return html`<kei-personen type="${persoonType}"></kei-personen>`;
        }
      case '':
        return html`<h2>Home</h2>`;
      default:
        router.navigate('/');
        return undefined;
    }
  }
}
