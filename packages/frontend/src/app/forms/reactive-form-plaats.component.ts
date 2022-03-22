import { Plaats } from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  AutocompleteComponent,
  capitalize,
  plaatsService,
  TypeAheadHint,
} from '../shared';
import { PlaatsControl } from './form-control';
import { plaatsName } from './plaats.pipes';

@customElement('kei-reactive-form-plaats')
export class ReactiveFormPlaats<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: PlaatsControl<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  public override render() {
    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        <label for="${this.control.name}" class="col-form-label"
          >${this.control.label ?? capitalize(this.control.name)}</label
        >
      </div>
      <kei-autocomplete
        class="col-lg-10 col-md-8"
        placeholder="Woonplaats"
        .textValue=${plaatsName(
          this.entity[this.control.name] as unknown as Plaats,
        )}
        .searchAction="${(val: string): Promise<TypeAheadHint<Plaats>[]> =>
          plaatsService.getAll({ search: val }).then((plaatsen) =>
            plaatsen.map((plaats) => ({
              text: plaatsName(plaats),
              value: plaats,
            })),
          )}"
        @submit="${(ev: CustomEvent<TypeAheadHint<Plaats>>) => {
          const target = ev.target as AutocompleteComponent;
          (this.entity[this.control.name] as unknown as Plaats) =
            ev.detail.value;
          target.setSearchValue(ev.detail.text);
          target.blur();
        }}"
      ></kei-autocomplete>
    </div>`;
  }
}
