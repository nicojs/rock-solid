import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormArray, KeysOfType } from './form-control';
import { capitalize, singularize } from '../shared';
import { FormElement } from './form-element';

@customElement('rock-reactive-form-array')
export class ReactiveFormArrayComponent<
  TEntity,
  TItem,
  TKey extends KeysOfType<TEntity, Array<TItem>>,
> extends FormElement<TEntity> {
  @property({ attribute: false })
  public override control!: FormArray<TEntity, TItem, TKey>;

  public get items(): TItem[] {
    return this.entity[this.control.name] as unknown as TItem[];
  }

  @property({ attribute: false, type: Array })
  public set items(val: TItem[]) {
    (this.entity[this.control.name] as unknown as TItem[]) = val;
    this.requestUpdate('items');
  }

  override connectedCallback() {
    super.connectedCallback();
    this.items = this.entity[this.control.name] as unknown as TItem[];
  }

  private addNew = () => {
    this.items = [...this.items, {} as unknown as TItem];
  };

  private removeItem(val: TItem) {
    this.items = this.items.filter((item) => item !== val);
  }

  public override render() {
    return html` <fieldset>
      <div class="row">
        <div class="d-flex justify-content-end mb-3">
          <button
            type="button"
            @click=${this.addNew}
            class="btn btn-outline-primary"
          >
            + ${capitalize(singularize(this.control.name))}
          </button>
        </div>
        ${this.items.map(
          (item, index) =>
            html`<div class="row mb-3 border">
              <div class="d-flex justify-content-between">
                <span class="form-text"
                  >${capitalize(singularize(this.control.name))}</span
                >
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  title="Verwijder"
                  @click=${() => this.removeItem(item)}
                ></button>
              </div>
              ${this.control.controls.map(
                (control) => html`<rock-reactive-form-control
                  .control="${control}"
                  .entity="${item}"
                  .path="${this.name}_${index}"
                ></rock-reactive-form-control>`,
              )}
            </div>`,
        )}
      </div>
    </fieldset>`;
  }
}
