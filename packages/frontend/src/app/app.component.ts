import { Subscription } from 'rxjs';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { router, RouteParams } from './router';
import { bootstrap } from '../styles';
import style from './app.component.scss';
import { PersoonType, ProjectType } from '@rock-solid/shared';

@customElement('rock-solid-app')
export class RockSolidApp extends LitElement {
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
        <nav
          class="d-print-none navbar navbar-light bg-light justify-content-between"
        >
          <span class="navbar-brand mb-0 h1">
            <img
              src="/rock-solid.png"
              alt="Rock Solid"
              width="30"
              height="24"
            />
            Rock Solid.
            <span class="text-muted fs-6"
              >Steenvast en solide management systeem voor De Kei en
              Kei-Jong</span
            >
          </span>
          <rock-user></rock-user>
        </nav>
        <div class="row">
          <rock-nav
            class="col-xs-5 col-sm-4 col-md-3 col-lg-2 d-print-none"
            .active="${this.route?.path[0]}"
          ></rock-nav>
          <main class="col-xs-7 col-sm-8 col-md-9 col-lg-10">
            ${this.renderMain()}
          </main>
        </div>
      </div>
      <rock-modal></rock-modal>`;
  }

  private renderMain() {
    switch (this.route?.path[0]) {
      case 'login':
        return html`<rock-login
          .queryString="${this.route.queryString}"
        ></rock-login>`;
      case 'cursussen':
      case 'vakanties':
        const projectType: ProjectType =
          this.route.path[0] === 'cursussen' ? 'cursus' : 'vakantie';
        return html`<rock-projecten
          .path="${this.route.path.slice(1)}"
          .type="${projectType}"
          .query="${this.route.query}"
        ></rock-projecten>`;
      case 'overige-personen':
      case 'deelnemers':
        const persoonType: PersoonType =
          this.route?.path[0] === 'deelnemers' ? 'deelnemer' : 'overigPersoon';
        return html`<rock-personen
          .type="${persoonType}"
          .path="${this.route.path.slice(1)}"
        ></rock-personen>`;
      case 'organisaties':
        return html`<rock-organisaties
          .path=${this.route.path.slice(1)}
        ></rock-organisaties>`;
      case 'rapportages':
        return html`<rock-rapportages
          .path=${this.route.path.slice(1)}
        ></rock-rapportages>`;
      case undefined:
        return html`<rock-home></rock-home>`;
      default:
        router.navigate('/');
        return undefined;
    }
  }
}
