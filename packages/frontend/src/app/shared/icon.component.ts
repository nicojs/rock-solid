// See icons.getbootstrap.com/icons
import { css, LitElement } from 'lit';
import { html } from 'lit-html';
import { customElement, property } from 'lit/decorators.js';
import { icons } from './icons';
@customElement('kei-icon')
export class IconComponent extends LitElement {
  @property()
  public icon!: keyof typeof icons;

  @property()
  public size: 'sm' | 'md' | 'lg' = 'md';

  static override styles = [
    css`
      .icon-sm svg {
        width: 8px;
        height: 8px;
      }
      .icon-md svg {
        width: 16px;
        height: 16px;
      }
      .icon-lg svg {
        width: 32px;
        height: 32px;
      }
    `,
  ];

  override render() {
    return html`<span class="icon-${this.size}">${icons[this.icon]}</span>`;
  }
}
