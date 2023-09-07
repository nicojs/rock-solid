import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl } from './form-control';
import { Privilege } from '@rock-solid/shared';
import { privilege } from '../auth/privilege.directive';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('rock-reactive-form')
export class ReactiveFormComponent<TEntity> extends LitElement {
  static override styles = [
    bootstrap,
    css`
      .tags-input {
        cursor: text;
      }
      .tags-input input {
        display: inline-block;
        border: none;
        box-shadow: none;
        outline: none;
        background-color: transparent;
        padding: 0 6px;
        margin: 0;
        width: auto;
        max-width: inherit;
      }
    `,
  ];

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  public controls!: FormControl<TEntity>[];

  @property()
  public submitLabel = 'Opslaan';

  @property({ attribute: false })
  private wasValidated = false;

  @property()
  public privilege?: Privilege;

  private formRef = createRef<HTMLFormElement>();

  override render() {
    return html`<form
      novalidate
      ${ref(this.formRef)}
      class="${this.wasValidated ? 'was-validated' : ''}"
      @submit="${this.submit}"
    >
      ${this.renderControls()}
      <div class="row">
        <div class="col offset-lg-2 offset-md-4">
          <button
            ${privilege(this.privilege)}
            class="btn btn-primary"
            type="submit"
          >
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
  private renderControls() {
    return html`<rock-reactive-form-control-list
      .entity=${this.entity}
      .controls=${this.controls}
    ></rock-reactive-form-control-list>`;
  }
}
