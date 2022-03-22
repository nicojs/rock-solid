import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FormGroup } from './form-control';
import { capitalize } from '../shared';

@customElement('kei-reactive-form-group')
export class ReactiveFormGroupComponent<
  TEntity,
  TKey extends keyof TEntity & string,
> extends LitElement {
  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  @property({ attribute: false })
  public control!: FormGroup<TEntity, TKey>;

  @property({ attribute: false })
  public entity!: TEntity;

  public get value(): TEntity[TKey] {
    return this.entity[this.control.name];
  }

  @state()
  public set value(val: TEntity[TKey]) {
    this.entity[this.control.name] = val;
    this.requestUpdate('items');
  }

  override connectedCallback() {
    super.connectedCallback();
    this.value = this.entity[this.control.name];
  }

  public override render() {
    return html` <fieldset class="row mb-3 border">
      <legend class="form-text">${capitalize(this.control.name)}</legend>

      ${this.control.controls.map(
        (control) => html`<kei-reactive-form-control
          .control="${control}"
          .entity="${this.value}"
        ></kei-reactive-form-control>`,
      )}
    </fieldset>`;
  }
}
