import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { InputType } from '.';
import { bootstrap } from '../../styles';
import { FormControl } from './form-control';

@customElement('kei-reactive-form')
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
        if (control.type === InputType.group) {
          return html`<kei-reactive-form-group
            .control=${control}
            .entity=${this.entity}
          ></kei-reactive-form-group>`;
        }
        return html`<kei-reactive-form-control
          .control="${control}"
          .entity="${this.entity}"
        ></kei-reactive-form-control>`;
      })}
      <div class="row">
        <div class=" offset-lg-2 offset-md-4">
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
