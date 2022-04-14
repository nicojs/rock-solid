import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

/**
 * @see https://loading.io/css/
 */
@customElement('rock-loading')
export class LoadingComponent extends LitElement {
  static override styles = [
    css`
      .lds-heart {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
        transform: rotate(45deg);
        transform-origin: 40px 40px;
      }
      .lds-heart div {
        top: 32px;
        left: 32px;
        position: absolute;
        width: 32px;
        height: 32px;
        background: var(--loading-color);
        animation: lds-heart 1.2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
      }
      .lds-heart div:after,
      .lds-heart div:before {
        content: ' ';
        position: absolute;
        display: block;
        width: 32px;
        height: 32px;
        background: var(--loading-color);
      }
      .lds-heart div:before {
        left: -24px;
        border-radius: 50% 0 0 50%;
      }
      .lds-heart div:after {
        top: -24px;
        border-radius: 50% 50% 0 0;
      }
      @keyframes lds-heart {
        0% {
          transform: scale(0.95);
        }
        5% {
          transform: scale(1.1);
        }
        39% {
          transform: scale(0.85);
        }
        45% {
          transform: scale(1);
        }
        60% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(0.9);
        }
      }
    `,
  ];

  override render() {
    return html`<div class="lds-heart"><div></div></div>`;
  }
}
