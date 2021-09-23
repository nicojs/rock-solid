import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputDescription } from './input-description';

@customElement('kei-reactive-form')
export class ReactiveFormComponent<TEntity> extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  public controls!: InputDescription<TEntity>[];

  @property()
  public submitLabel = 'Opslaan';

  @property({ attribute: false })
  private wasValidated = false;

  override render() {
    return html`<form
      novalidate
      class="${this.wasValidated ? 'was-validated' : ''}"
      @submit="${this.submit}"
    >
      ${this.controls?.map(
        (control) =>
          html`<kei-reactive-form-control
            .control="${control}"
            .entity="${this.entity}"
          ></kei-reactive-form-control>`,
      )}
      <button class="btn btn-primary offset-sm-2" type="submit">
        ${this.submitLabel}
      </button>
    </form>`;
  }

  submit(e: SubmitEvent) {
    e.preventDefault();
    if ((e.target as HTMLFormElement).checkValidity()) {
      console.log('submit', this.entity);
      const submitEvent = new CustomEvent('kei-submit', {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(submitEvent);
      this.wasValidated = false;
    } else {
      this.wasValidated = true;
    }
  }
}
