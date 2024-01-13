import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';

@customElement('rock-link')
export class Link extends LitElement {
  static override styles = [bootstrap];

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
        href="${this.href}"
        @click="${this.linkClick}"
      >
        <slot></slot>
      </a>
    `;
  }

  linkClick(event: MouseEvent) {
    event.preventDefault();
    router.navigate(this.href);
  }
}
