import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html, LitElement } from 'lit';
import { bootstrap } from '../../styles';

/**
 * @see https://loading.io/css/
 */
@customElement('rock-text-search')
export class TextSearchComponent extends LitElement {
  static override styles = [bootstrap];

  private searchRef = createRef<HTMLInputElement>();

  @property()
  public placeholder = 'Zoek op naam';

  private searchFormSubmit(submitEvent: SubmitEvent) {
    submitEvent.preventDefault();
    const event = new CustomEvent('search-submitted', {
      bubbles: true,
      composed: true,
      detail: this.searchRef.value!.value,
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<form @submit=${this.searchFormSubmit} class="input-group">
      <input
        type="text"
        ${ref(this.searchRef)}
        class="form-control"
        .placeholder=${this.placeholder}
      />
      <button type="submit" class="btn btn-outline-secondary">
        <rock-icon icon="search"></rock-icon>
      </button>
    </form>`;
  }
}
