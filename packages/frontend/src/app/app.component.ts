import { Subscription } from 'rxjs';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { router, RouteParams } from './router';
import style from './app.component.scss';
import { PersoonType, ProjectType } from '@rock-solid/shared';
import { Theme } from './home/theme-toggle.component';

@customElement('rock-solid-app')
export class RockSolidApp extends LitElement {
  public static override styles = [unsafeCSS(style)];

  private sub?: Subscription;

  override connectedCallback() {
    super.connectedCallback();
    this.sub = router.routeChange$.subscribe((route) => (this.route = route));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.sub?.unsubscribe();
  }

  @state()
  public route?: RouteParams;

  @state()
  public theme: Theme = 'light';

  public override render() {
    return html`<div data-bs-theme="${this.theme}">
      <nav class="d-print-none navbar bg-body-tertiary justify-content-between">
        <span class="navbar-brand mb-0 h1">
          <img src="/rock-solid.png" alt="Rock Solid" width="30" height="24" />
          Rock Solid.
          <span class="text-muted fs-6"
            >Steenvast en solide management systeem voor De Kei en
            Kei-Jong</span
          >
        </span>
        <div class="justify-content-between d-flex">
          <rock-user class="bg-body-tertiary me-3"></rock-user>
          <rock-theme-toggle
            @theme-changed=${(ev: CustomEvent<Theme>) =>
              (this.theme = ev.detail)}
          ></rock-theme-toggle>
        </div>
      </nav>

      <div class="container-fluid">
        <div class="row">
          <div class="col-xs-5 col-sm-4 col-md-3 col-lg-2 d-print-none">
            <rock-nav class="" .active="${this.route?.path[0]}"></rock-nav>
          </div>
          <div class="col-xs-7 col-sm-8 col-md-9 col-lg-10">
            <main class="">${this.renderMain()}</main>
          </div>
        </div>
      </div>
      <rock-modal></rock-modal>
    </div>`;
  }

  private renderMain() {
    switch (this.route?.path[0]) {
      case 'login':
        return html`<rock-login
          .queryString=${this.route.queryString}
        ></rock-login>`;
      case 'cursussen':
      case 'vakanties':
        const projectType: ProjectType =
          this.route.path[0] === 'cursussen' ? 'cursus' : 'vakantie';
        return html`<rock-projecten
          .path=${this.route.path.slice(1)}
          .type=${projectType}
          .query="${this.route.query}"
        ></rock-projecten>`;
      case 'overige-personen':
      case 'deelnemers':
        const persoonType: PersoonType =
          this.route?.path[0] === 'deelnemers' ? 'deelnemer' : 'overigPersoon';
        return html`<rock-personen
          .type=${persoonType}
          .path="${this.route.path.slice(1)}"
          .query=${this.route.query}
        ></rock-personen>`;
      case 'organisaties':
        return html`<rock-organisaties
          .path=${this.route.path.slice(1)}
          .query=${this.route.query}
        ></rock-organisaties>`;
      case 'locaties':
        return html`<rock-locaties
          .path=${this.route.path.slice(1)}
          .query=${this.route.query}
        ></rock-locaties>`;
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
