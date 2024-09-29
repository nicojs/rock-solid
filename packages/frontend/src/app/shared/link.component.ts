import { PropertyValues, css, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { RockElement } from '../rock-element';

@customElement('rock-link')
export class Link extends RockElement {
  static override styles = [
    bootstrap,
    css`
      :host {
        display: inline-block;
      }
    `,
  ];

  @property({ type: Boolean })
  public btn = false;

  @property({ type: Boolean })
  public btnPrimary = false;

  @property({ type: Boolean })
  public btnSuccess = false;

  @property({ type: Boolean })
  public btnWarning = false;

  @property({ type: Boolean })
  public btnSecondary = false;

  @property({ type: Boolean })
  public btnOutlineSecondary = false;

  @property({ type: Boolean })
  public btnOutlinePrimary = false;

  @property({ type: Boolean })
  public lg = false;

  @property({ type: Boolean })
  public sm = false;

  @property()
  public href = '';

  @property({ type: Boolean })
  public keepQuery = false;

  protected override update(changedProperties: PropertyValues<Link>): void {
    if (this.keepQuery) {
      this.subscription.add(
        router.routeChange$.subscribe(() => {
          this.requestUpdate();
        }),
      );
    }
    super.update(changedProperties);
  }

  get url() {
    const url = new URL(this.href, window.location.href);
    if (this.keepQuery) {
      Object.entries(router.activeRoute.query).forEach(([key, value]) =>
        url.searchParams.set(key, value),
      );
    }
    return url.href;
  }

  override render() {
    return html`
      <a
        class="${classMap({
          btn: this.btn,
          'btn-lg': this.lg,
          'btn-sm': this.sm,
          'btn-primary': this.btnPrimary,
          'btn-success': this.btnSuccess,
          'btn-warning': this.btnWarning,
          'btn-secondary': this.btnSecondary,
          'btn-outline-secondary': this.btnOutlineSecondary,
          'btn-outline-primary': this.btnOutlinePrimary,
        })}"
        href="${this.url}"
        @click="${(ev: MouseEvent) => this.linkClick(ev)}"
      >
        <slot></slot>
      </a>
    `;
  }

  linkClick(event: MouseEvent) {
    event.preventDefault();
    router.navigate(this.url);
  }
}
