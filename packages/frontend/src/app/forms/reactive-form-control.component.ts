import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { capitalize } from '../shared';
import { FormControl, InputControl, InputType } from './form-control';

@customElement('rock-reactive-form-control')
export class ReactiveFormControl<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: FormControl<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  override render() {
    switch (this.control.type) {
      case InputType.array:
        return html`<rock-reactive-form-array
          .control=${this.control}
          .entity=${this.entity}
        ></rock-reactive-form-array>`;
      case InputType.group:
        return html`<rock-reactive-form-group
          .control=${this.control}
          .entity=${this.entity}
        ></rock-reactive-form-group>`;
      case InputType.plaats:
        return html`<rock-reactive-form-plaats .control=${this.control} .entity=${this.entity}></rock-reactive-form-plaats>
        </rock-reactive-form-plaats>`;
      default:
        return this.renderInputControl(this.control);
    }
  }

  private renderInputControl(control: InputControl<TEntity>) {
    return html` <div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        ${control.type !== InputType.checkbox
          ? html`<label for="${this.control.name}" class="col-form-label"
              >${control.label ?? capitalize(this.control.name)}</label
            >`
          : ''}
      </div>
      <rock-reactive-form-input-control
        class="col-lg-10 col-md-8"
        .control="${control}"
        .entity="${this.entity}"
      ></rock-reactive-form-input-control>
    </div>`;
  }
}
