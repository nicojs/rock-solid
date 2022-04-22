import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { capitalize } from '../shared';
import { InputControl, InputType } from './form-control';
import { FormElement } from './form-element';

@customElement('rock-reactive-form-control')
export class ReactiveFormControl<TEntity> extends FormElement<TEntity> {
  override render() {
    switch (this.control.type) {
      case InputType.array:
        return html`<rock-reactive-form-array
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
        ></rock-reactive-form-array>`;
      case InputType.group:
        return html`<rock-reactive-form-group
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
        ></rock-reactive-form-group>`;
      case InputType.plaats:
        return html`<rock-reactive-form-plaats
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
        ></rock-reactive-form-plaats>`;
      default:
        return this.renderInputControl(this.control);
    }
  }

  private renderInputControl(control: InputControl<TEntity>) {
    return html` <div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        ${control.type !== InputType.checkbox
          ? html`<label for="${this.name}" class="col-form-label"
              >${control.label ?? capitalize(this.control.name)}</label
            >`
          : ''}
      </div>
      <rock-reactive-form-input-control
        class="col-lg-10 col-md-8"
        .control="${control}"
        .entity="${this.entity}"
        .path="${this.path}"
      ></rock-reactive-form-input-control>
    </div>`;
  }
}
