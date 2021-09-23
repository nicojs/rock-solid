import { ifDefined } from 'lit/directives/if-defined.js';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { InputType } from '.';
import {
  CheckboxInputDescription,
  InputDescription,
  StringInputDescription,
} from './input-description';

@customElement('kei-reactive-form-control')
export class ReactiveFormControl<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: InputDescription<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  private validationMessage = '';

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  override render() {
    return html`<div class="mb-3 row">
      <label for="${this.control.name}" class="col-sm-2 col-form-label"
        >${this.control.label ?? this.control.name}</label
      >
      <div class="col-sm-10">
        ${this.renderInput(this.control)}
        <div class="invalid-feedback">${this.validationMessage}</div>
      </div>
    </div>`;
  }

  private renderInput(control: InputDescription<TEntity>) {
    switch (control.type) {
      case InputType.checkbox:
        return this.renderCheckbox(control);
      case InputType.text:
      case InputType.email:
        return this.renderStringInput(control);
    }
  }

  private renderCheckbox(control: CheckboxInputDescription<TEntity>) {
    return html`<input
      type="checkbox"
      class="form-control"
      ?required="${control.validators?.required}"
      ?checked="${this.entity[control.name]}"
    />`;
  }

  private renderStringInput(control: StringInputDescription<TEntity>) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id="${control.name}"
      value="${this.entity[control.name]}"
      ?required="${control.validators?.required}"
      minlength="${ifDefined(control.validators?.minLength)}"
      @invalid="${this.updateValidationMessage}"
      @change="${(e: Event) => {
        this.updateValidationMessage(e);
        const inputEl = e.target as HTMLInputElement;
        (this.entity[control.name] as unknown as string) = inputEl.value;
      }}"
    /> `;
  }

  private updateValidationMessage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    this.validationMessage = inputEl.validationMessage;
  }

  // private renderSelect(control: EnumInputDescription<TEntity>) {
  //   return html`<select class="form-select">
  //     ${control.items.map(
  //       (item) =>
  //         html`<option
  //           value="item"
  //           ?selected="${(item as unknown as TEntity[keyof TEntity]) ===
  //           this.entity[control.name]}"
  //         >
  //           ${item}
  //         </option>`,
  //     )}
  //   </select>`;
  // }
}
