import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { bootstrap } from '../../styles';

@customElement('rock-home')
export class HomeComponent extends LitElement {
  public static override styles = [bootstrap];

  public override render() {
    return html`<h2 class="display-1">
        Rock Solid.
        <span class="text-muted fs-4"
          >Steenvast en solide management systeem voor De Kei en Kei-Jong</span
        >
      </h2>
      <img src="/rock-solid.png" />`;
  }
}
