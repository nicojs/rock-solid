import { Subscription } from 'rxjs';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { router, RouteParams } from './router';
import { bootstrap } from '../styles';
import style from './app.component.scss';
import { PersoonType, ProjectType } from '@kei-crm/shared';

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
      case 'vakanties':
        const projectType: ProjectType =
          this.route.path[0] === 'cursussen' ? 'cursus' : 'vakantie';
        return html`<kei-projecten
          .path="${this.route.path.slice(1)}"
          .type="${projectType}"
          .query="${this.route.query}"
        ></kei-projecten>`;
      case 'vrijwilligers':
      case 'deelnemers':
        const persoonType: PersoonType =
          this.route?.path[0] === 'deelnemers' ? 'deelnemer' : 'vrijwilliger';
        return html`<kei-personen
          .type="${persoonType}"
          .path="${this.route.path.slice(1)}"
        ></kei-personen>`;
      case '':
        return html`<h2>Home</h2>`;
      default:
        router.navigate('/');
        return undefined;
    }
  }
}
