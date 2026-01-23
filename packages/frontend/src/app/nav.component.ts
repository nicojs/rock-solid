/* eslint-disable @typescript-eslint/unbound-method */
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../styles';
import { routesByPersoonType } from './personen';
import { router } from './router';
import { privilege } from './auth/privilege.directive';

@customElement('rock-nav')
export class NavComponent extends LitElement {
  public static override styles = [bootstrap];

  @property({ attribute: true })
  public active?: string;

  private activeClass(url: string | undefined) {
    return url === this.active ? 'active' : '';
  }

  public override render() {
    return html`<ul class="nav flex-column nav-pills">
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass(undefined)}"
          @click="${router.linkClick}"
          aria-current="page"
          href="/"
          >Home</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass(routesByPersoonType.deelnemer)}"
          @click="${router.linkClick}"
          href="/${routesByPersoonType.deelnemer}"
          >Deelnemers</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass(
            routesByPersoonType.overigPersoon,
          )}"
          @click="${router.linkClick}"
          href="/${routesByPersoonType.overigPersoon}"
          >Overige personen</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('cursussen')}"
          @click="${router.linkClick}"
          href="/cursussen"
          >Cursussen</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('vakanties')}"
          @click="${router.linkClick}"
          href="/vakanties"
          >Vakanties</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('organisaties')}"
          @click="${router.linkClick}"
          href="/organisaties"
          >Organisaties</a
        >
      </li>
      <li class="nav-item" ${privilege('custom:manage-plaatsen')}>
        <a
          class="nav-link ${this.activeClass('locaties')}"
          @click="${router.linkClick}"
          href="/locaties"
          >Locaties</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('plaatsen')}"
          @click="${router.linkClick}"
          href="/plaatsen"
          >Plaatsen</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link ${this.activeClass('rapportages')}"
          @click="${router.linkClick}"
          href="/rapportages"
          >Rapportages</a
        >
      </li>
    </ul>`;
  }
}
