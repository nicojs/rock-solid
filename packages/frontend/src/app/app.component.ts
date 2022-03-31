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
    return html`<div class="container-fluid">
      <nav class="navbar navbar-light bg-light justify-content-between">
        <span class="navbar-brand mb-0 h1"
          >RockSolid.
          <span class="text-muted fs-6"
            >Solide management systeem voor De Kei en Kei-Jong</span
          ></span
        >
        <kei-user></kei-user>
      </nav>
      <div class="row">
        <kei-nav
          class="col-xs-5 col-sm-4 col-md-3 col-lg-2"
          .active="${this.route?.path[0]}"
        ></kei-nav>
        <main class="col">${this.renderMain()}</main>
      </div>
    </div>`;
  }

  private renderMain() {
    switch (this.route?.path[0]) {
      case 'login':
        return html`<kei-login
          .queryString="${this.route.queryString}"
        ></kei-login>`;
      case 'cursussen':
      case 'vakanties':
        const projectType: ProjectType =
          this.route.path[0] === 'cursussen' ? 'cursus' : 'vakantie';
        return html`<kei-projecten
          .path="${this.route.path.slice(1)}"
          .type="${projectType}"
          .query="${this.route.query}"
        ></kei-projecten>`;
      case 'overige-personen':
      case 'deelnemers':
        const persoonType: PersoonType =
          this.route?.path[0] === 'deelnemers' ? 'deelnemer' : 'overigPersoon';
        return html`<kei-personen
          .type="${persoonType}"
          .path="${this.route.path.slice(1)}"
        ></kei-personen>`;
      case 'organisaties':
        return html`<kei-organisaties
          .path=${this.route.path.slice(1)}
        ></kei-organisaties>`;
      case '':
        return html`<h2>Home</h2>`;
      default:
        router.navigate('/');
        return undefined;
    }
  }
}
