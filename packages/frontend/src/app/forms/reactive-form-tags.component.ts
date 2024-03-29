import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { capitalize, TypeAheadHint } from '../shared';
import { ArrayItem, KeysOfType, TagsControl } from './form-control';
import { FormControlElement } from './form-element';
import { fromEvent, map, tap } from 'rxjs';

@customElement('rock-reactive-form-tags')
export class ReactiveFormTags<
  TEntity,
  TKey extends KeysOfType<TEntity, any[]>,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: TagsControl<TEntity, TKey>;
  private inputRef = createRef<HTMLInputElement>();
  private get input() {
    return this.inputRef.value!;
  }

  @state()
  get tags(): ArrayItem<TEntity[TKey]>[] {
    return (
      (this.entity[this.control.name] as
        | ArrayItem<TEntity[TKey]>[]
        | undefined) ?? []
    );
  }
  set tags(val: ArrayItem<TEntity[TKey]>[]) {
    const oldValue = this.tags;
    (this.entity[this.control.name] as ArrayItem<TEntity[TKey]>[]) = val;
    this.requestUpdate('tags', oldValue);
  }

  private removeTag(tag: ArrayItem<TEntity[TKey]>) {
    this.tags = this.tags.filter((item) => item !== tag);
  }
  private addTag(tag: ArrayItem<TEntity[TKey]>) {
    this.tags = [...this.tags, tag];
  }

  override firstUpdated() {
    this.subscription.add(
      fromEvent(this.input, 'keydown')
        .pipe(
          map((event) => event as KeyboardEvent),
          tap((event) => {
            if (event.key === 'Backspace' && this.input.value.length === 0) {
              const lastTag = this.tags.at(-1);
              if (lastTag) {
                this.removeTag(lastTag);
              }
            }
          }),
        )
        .subscribe(),
    );
  }

  public override render() {
    return html`<div class="row mb-3">
      <div class="col-lg-2 col-md-4">
        <label for="${this.name}" class="col-form-label"
          >${this.control.label ?? capitalize(this.control.name)}</label
        >
      </div>
      <div class="col-lg-10 col-md-8">
        <div class="row">
          <div class="col">
            <div
              @click=${() => this.input.focus()}
              class="tags-input form-control"
            >
              ${this.tags.map(
                (tag) =>
                  html`<span class="badge text-bg-primary me-2"
                    >${this.control.tagText(tag)}
                    <button
                      @click=${(event: Event) => {
                        this.removeTag(tag);
                        event.stopPropagation();
                      }}
                      class="btn-close btn-close-white"
                      type="button"
                    ></button
                  ></span>`,
              )}
              <input
                ${ref(this.inputRef)}
                type="text"
                autocomplete="off"
                id="${this.name}"
                name="${this.control.name}"
                ?required=${this.control.validators?.required}
                placeholder=${ifDefined(this.control.placeholder)}
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <rock-autocomplete
              .searchAction=${this.control.searchAction}
              minCharacters=${ifDefined(this.control.minCharacters)}
              @selected=${(
                ev: CustomEvent<TypeAheadHint<ArrayItem<TEntity[TKey]>>>,
              ) => {
                this.addTag(ev.detail.value);
                this.input.value = '';
                this.input.dispatchEvent(new Event('input'));
                this.input.focus();
              }}
            ></rock-autocomplete>
          </div>
        </div>
      </div>
    </div>`;
  }
}
