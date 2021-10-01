import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';

@customElement('kei-link')
export class Link extends LitElement {
  static override styles = [bootstrap];

  @property({ type: Boolean })
  public btn = false;

  @property({ type: Boolean })
  public btnPrimary = false;

  @property({ type: Boolean })
  public btnSuccess = false;

  @property({ type: Boolean })
  public btnSecondary = false;

  @property({ type: Boolean })
  public lg = false;

  @property()
  public href = '';

  override render() {
    return html`
      <a
        class="${classMap({
          btn: this.btn,
          'btn-lg': this.lg,
          'btn-primary': this.btnPrimary,
          'btn-success': this.btnSuccess,
          'btn-secondary': this.btnSecondary,
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
