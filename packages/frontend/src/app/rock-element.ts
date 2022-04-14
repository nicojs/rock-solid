import { LitElement } from 'lit';
import { Subscription } from 'rxjs';

export class RockElement extends LitElement {
  protected readonly subscription = new Subscription();

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscription.unsubscribe();
  }
}
