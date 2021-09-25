import { Subscription } from 'rxjs';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { router, RouteParams } from '../router';
import { bootstrap } from '../../styles';
import style from './app.component.scss';

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
      <kei-nav .active="${this.route?.path[0]}"></kei-nav>
      <main>${this.renderMain()}</main>
    </div>`;
  }

  private renderMain() {
    switch (this.route?.path[0]) {
      case 'cursussen':
        return html`<h2>Cursussen</h2>`;
      case 'personen':
        switch (this.route.path[1]) {
          case 'edit':
            return html`<kei-personen-edit
              entityId="${this.route.path[2]}"
            ></kei-personen-edit>`;
          case 'new':
            return html`<kei-personen-edit
              type="${this.route.path[2]}"
            ></kei-personen-edit>`;
          default:
            return html`<kei-personen></kei-personen>`;
        }
      case '':
        return html`<h2>Home</h2>`;
      default:
        router.navigate('/');
        return undefined;
    }
  }
}
