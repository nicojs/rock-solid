import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormControl, InputControl, InputType } from './form-control';

@customElement('kei-reactive-form-control')
export class ReactiveFormControl<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: FormControl<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  private validationMessage = '';

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  override render() {
    switch (this.control.type) {
      case InputType.array:
        return html`<kei-reactive-form-array
          .control=${this.control}
          .entity=${this.entity}
        ></kei-reactive-form-array>`;
      case InputType.group:
        return html`<kei-reactive-form-group
          .control=${this.control}
          .entity=${this.entity}
        ></kei-reactive-form-group>`;
      case InputType.plaats:
        return html`<kei-reactive-form-plaats .control=${this.control} .entity=${this.entity}></kei-reactive-form-plaats>
        </kei-reactive-form-plaats>`;
      default:
        return this.renderInputControl(this.control);
    }
  }
  private renderInputControl(control: InputControl<TEntity>) {
    return html`<kei-reactive-form-input-control
      .control="${control}"
      .entity="${this.entity}"
    ></kei-reactive-form-input-control>`;
  }
}
