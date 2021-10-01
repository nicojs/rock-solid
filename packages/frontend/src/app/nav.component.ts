import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../styles';
import { router } from './router';

@customElement('kei-nav')
export class NavComponent extends LitElement {
  public static override styles = [bootstrap];

  @property({ attribute: true })
  public active?: string;

  private activeClass(url: string) {
    return url === this.active ? 'active' : '';
  }

  public override render() {
    return html`<ul class="nav flex-column nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('')}"
          @click="${router.linkClick}"
          aria-current="page"
          href="/"
          >Home</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('deelnemers')}"
          @click="${router.linkClick}"
          href="/deelnemers"
          >Deelnemers</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('vrijwilligers')}"
          @click="${router.linkClick}"
          href="/vrijwilligers"
          >Vrijwilligers</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('projecten')}"
          @click="${router.linkClick}"
          href="/projecten"
          >Projecten</a
        >
      </li>
    </ul>`;
  }
}
