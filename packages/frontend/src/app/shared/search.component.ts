import { LitElement, PropertyValueMap, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl, InputControl } from '../forms';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('rock-search')
export class SearchComponent<
  TFilter extends Record<string, unknown>,
> extends LitElement {
  static override styles = [bootstrap];

  @property()
  public mainControl!: InputControl<TFilter>;

  @property()
  public advancedControls?: FormControl<TFilter>[];

  @property()
  public filter!: TFilter;

  @state()
  private showAdvancedSearch = false;

  public override update(props: PropertyValueMap<SearchComponent<TFilter>>) {
    if (props.has('filter') || props.has('advancedControls')) {
      const advancedSearchKeys = this.advancedControls?.map(({ name }) => name);
      this.showAdvancedSearch = Object.entries(this.filter)
        .filter(([key]) => advancedSearchKeys?.includes(key))
        .some(([, value]) => value !== undefined);
    }
    super.update(props);
  }

  private cancelAdvancedSearch() {
    this.showAdvancedSearch = false;
    this.advancedControls?.forEach((control) => {
      (this.filter[control.name as keyof TFilter] as undefined) = undefined;
    });
    this.dispatchEvent(
      new CustomEvent('search-submitted', {
        bubbles: true,
        composed: true,
        detail: this.filter,
      }),
    );
  }

  private submit = (event: SubmitEvent) => {
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent('search-submitted', {
        bubbles: true,
        composed: true,
        detail: this.filter,
      }),
    );
  };

  override render() {
    return html` <form @submit="${this.submit}">
      ${this.showAdvancedSearch
        ? nothing
        : html`<div class="row justify-content-end my-4 my-md-0">
            <div class="col-md-6">
              <div class="input-group">
                <input
                  class="form-control"
                  placeholder=${this.mainControl.placeholder}
                  @change="${(e: Event) => {
                    const inputEl = e.target as HTMLInputElement;
                    (this.filter as any)[this.mainControl.name] = inputEl.value;
                  }}"
                  value=${ifDefined(
                    this.filter[this.mainControl.name as keyof TFilter],
                  )}
                />
                <button
                  title="Geavanceerd zoeken"
                  type="button"
                  @click=${() => (this.showAdvancedSearch = true)}
                  class="btn btn-outline-secondary"
                >
                  <rock-icon icon="caretDownFill"></rock-icon>
                </button>
                <button type="submit" class="btn btn-outline-secondary">
                  <rock-icon icon="search"></rock-icon>
                </button>
              </div>
            </div>
          </div>`}
      ${this.showAdvancedSearch
        ? html`<div class="mt-4 row">
            <rock-reactive-form-control
              .entity=${this.filter}
              .control=${this.mainControl}
            >
            </rock-reactive-form-control>
            <rock-reactive-form-control-list
              .entity=${this.filter}
              .controls=${this.advancedControls}
            ></rock-reactive-form-control-list>
            <div class="col offset-lg-2 offset-md-4">
              <button type="submit" class="btn btn-primary">Zoeken</button>
              <button
                type="button"
                @click=${() => this.cancelAdvancedSearch()}
                class="btn btn-outline-secondary"
              >
                <rock-icon icon="caretUpFill"></rock-icon>
                Sluit geavanceerd zoeken
              </button>
            </div>
          </div>`
        : nothing}
    </form>`;
  }
}
