import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kei-edit-button')
export class EditButtonComponent extends LitElement {
  @property()
  public href?: string;

  override render() {
    return html`<kei-link btn href="${this.href}">✏</kei-link>`;
  }
}
