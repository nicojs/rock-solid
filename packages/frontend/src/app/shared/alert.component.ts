import { customElement, property } from 'lit/decorators.js';
import { html, LitElement, nothing } from 'lit';
import { bootstrap } from '../../styles';

export type AlertEmphasis = 'danger' | 'warning' | 'primary' | 'success';

/**
 * @see https://loading.io/css/
 */
@customElement('rock-alert')
export class AlertComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public message: string | undefined;

  @property()
  public emphasis: AlertEmphasis = 'danger';

  override render() {
    return html`${this.message
      ? html`<div
          class="alert alert-${this.emphasis} d-flex align-items-center"
          role="alert"
        >
          ${this.message}
        </div>`
      : nothing}`;
  }
}
