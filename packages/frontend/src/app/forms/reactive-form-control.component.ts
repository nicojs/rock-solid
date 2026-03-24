import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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

  public updateShow() {
    this.show = this.control.show?.(this.entity) ?? true;
  }

  @state()
  private show = true;

  inputRef = createRef<FormControlElement<unknown>>();

  override connectedCallback(): void {
    this.updateShow();
    super.connectedCallback();
  }

  override render() {
    if (!this.show) {
      return nothing;
    }
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
      case InputType.adres:
        return html`<rock-reactive-address
          .control=${this.control}
          .entity=${this.entity}
          .path=${this.path}
          ${ref(this.inputRef)}
        ></rock-reactive-address>`;
      default:
        return this.#renderInputControl(this.control);
    }
  }

  #renderLabel(control: InputControl<TEntity>, className: string) {
    if (control.type === InputType.checkbox) return '';
    return html`<label
      for=${generateInputId(control, this.path)}
      class="${className}"
      >${control.label ?? capitalize(this.control.name)}</label
    >`;
  }

  #renderInput(control: InputControl<TEntity>) {
    return html`<rock-reactive-form-input-control
      .control="${control}"
      .entity="${this.entity}"
      .path="${this.path}"
      ${ref(this.inputRef)}
    ></rock-reactive-form-input-control>`;
  }

  #renderInputControl(control: InputControl<TEntity>) {
    const labelCols = control.labelCols ?? 2;
    return html`<div class="row">
      <div class="col-lg-${labelCols} col-md-${labelCols * 2}">
        ${this.#renderLabel(control, 'col-form-label')}
      </div>
      <div class="col">${this.#renderInput(control)}</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rock-reactive-form-control': ReactiveFormControl<unknown>;
  }
}
