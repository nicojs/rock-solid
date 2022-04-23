import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl } from './form-control';

@customElement('rock-reactive-form')
export class ReactiveFormComponent<TEntity> extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  public controls!: FormControl<TEntity>[];

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
      ${this.controls?.map((control) => {
        return html`<rock-reactive-form-control
          .control=${control}
          .entity=${this.entity}
        ></rock-reactive-form-control>`;
      })}
      <div class="row">
        <div class="col offset-lg-2 offset-md-4">
          <button class="btn btn-primary" type="submit">
            ${this.submitLabel}
          </button>
        </div>
      </div>
    </form>`;
  }

  submit(e: SubmitEvent) {
    e.preventDefault();
    if ((e.target as HTMLFormElement).checkValidity()) {
      const submitEvent = new CustomEvent('rock-submit', {
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
