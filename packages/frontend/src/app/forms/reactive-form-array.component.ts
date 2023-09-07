import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormArray, KeysOfType } from './form-control';
import { capitalize, singularize } from '../shared';
import { FormControlElement } from './form-element';

@customElement('rock-reactive-form-array')
export class ReactiveFormArrayComponent<
  TEntity,
  TKey extends KeysOfType<TEntity, any[]>,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: FormArray<TEntity, TKey>;

  public get items(): any[] {
    return this.entity[this.control.name] as unknown as unknown[];
  }

  @property({ attribute: false, type: Array })
  public set items(val: any[]) {
    (this.entity[this.control.name] as unknown as unknown[]) = val;
    this.requestUpdate('items');
  }

  override connectedCallback() {
    super.connectedCallback();
    this.items = (this.entity[this.control.name] as unknown as unknown[]) ?? [];
  }

  private addNew = () => {
    this.items = [...this.items, this.control.factory()];
  };

  private removeItem(val: unknown) {
    this.items = this.items.filter((item) => item !== val);
  }

  public override render() {
    return html`<fieldset>
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
            <rock-reactive-form-control-list
              .entity=${item}
              .path=${`${this.name}_${index}`}
              .controls=${this.control.controls}
            ></rock-reactive-form-control-list>
          </div>`,
      )}
      <div class="d-flex justify-content-start mb-3">
        <button
          type="button"
          @click=${this.addNew}
          class="btn btn-outline-primary"
        >
          + ${capitalize(singularize(this.control.name))}
        </button>
      </div>
    </fieldset>`;
  }
}
