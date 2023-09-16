// See icons.getbootstrap.com/icons
import { css, LitElement } from 'lit';
import { html } from 'lit-html';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { icons } from './icons';
@customElement('rock-icon')
export class IconComponent extends LitElement {
  @property()
  public icon!: keyof typeof icons;

  @property()
  public size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  static override styles = [
    bootstrap,
    css`
      .icon-sm svg,
      .icon-sm img {
        width: 8px;
        height: 8px;
      }
      .icon-md svg,
      .icon-md img {
        width: 16px;
        height: 16px;
      }
      .icon-lg svg,
      .icon-lg img {
        width: 24px;
        height: 24px;
      }
      .icon-xl svg,
      .icon-xl img {
        width: 32px;
        height: 32px;
      }
    `,
  ];

  override render() {
    return html`<span class="icon-${this.size}">${icons[this.icon]}</span>`;
  }
}
