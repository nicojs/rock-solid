import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { capitalize } from '../shared';
import { FormControl, InputControl, InputType } from './form-control';
import { FormControlElement } from './form-element';
import { createRef, ref } from 'lit/directives/ref.js';
import { generateInputId } from './common';

@customElement('rock-reactive-form-control')
export class ReactiveFormControl<TEntity> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: FormControl<TEntity>;

  public override validate() {
    this.inputRef.value?.validate();
  }

  inputRef = createRef<FormControlElement<unknown>>();

  override render() {
    switch (this.control.type) {
      case InputType.array:
        return html`<rock-reactive-form-array
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-form-array>`;
      case InputType.group:
        return html`<rock-reactive-form-group
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-form-group>`;
      case InputType.tags:
        return html`<rock-reactive-form-tags
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-form-tags>`;
      case InputType.checkboxes:
        return html`<rock-reactive-checkboxes
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-checkboxes>`;
      case InputType.autocomplete:
        return html`<rock-reactive-form-autocomplete
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-form-autocomplete>`;
      default:
        return this.renderInputControl(this.control);
    }
  }

  private renderInputControl(control: InputControl<TEntity>) {
    return html` <div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        ${control.type !== InputType.checkbox
          ? html`<label
              for=${generateInputId(control, this.path)}
              class="col-form-label"
              >${control.label ?? capitalize(this.control.name)}</label
            >`
          : ''}
      </div>
      <rock-reactive-form-input-control
        class="col-lg-10 col-md-8"
        .control="${control}"
        .entity="${this.entity}"
        .path="${this.path}"
        ${ref(this.inputRef)}
      ></rock-reactive-form-input-control>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rock-reactive-form-control': ReactiveFormControl<unknown>;
  }
}
