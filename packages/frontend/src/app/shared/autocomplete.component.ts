import { css, html, LitElement } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { debounceTime, fromEvent, map, switchMap, tap } from 'rxjs';
import { escapeRegExp } from '@kei-crm/shared';
import { pluralize } from './utility.pipes';

interface TypeAheadTextPart {
  text: string;
  highlighted: boolean;
}
export interface TypeAheadHint<TValue = number | string> {
  value: TValue;
  text: string;
}
const minCharacters = 2;

@customElement('kei-autocomplete')
export class AutocompleteComponent extends LitElement {
  private searchRef = createRef<HTMLInputElement>();

  get searchInput(): HTMLInputElement {
    return this.searchRef.value!;
  }

  static override styles = [
    bootstrap,
    css`
      .dropdown-menu {
        top: 60px;
        width: 300px;
        left: 12px;
      }
    `,
  ];

  @property()
  public placeholder = 'Zoeken';

  @property({ attribute: false })
  public searchAction!: (text: string) => Promise<TypeAheadHint[]>;

  @property()
  public textValue = '';

  @property()
  public entityName?: string;

  @state()
  private isLoading = false;
  @state()
  private charactersRemaining: undefined | number;
  @state()
  private typeAheadShow = false;
  @state()
  private hintSelectedIndex = -1;
  @state()
  private hints: TypeAheadHint[] | undefined;

  get selectedHint(): TypeAheadHint | undefined {
    return this.hints?.[this.hintSelectedIndex];
  }

  override firstUpdated() {
    fromEvent(this, 'focus').subscribe(() => {
      this.typeAheadShow = true;
    });
    fromEvent(this, 'blur').subscribe(() => (this.typeAheadShow = false));
    const updateTypeAheadState = (value: string) => {
      if (value.length < minCharacters) {
        this.charactersRemaining = minCharacters - value.length;
        this.hints = undefined;
      } else {
        this.charactersRemaining = undefined;
      }
    };
    updateTypeAheadState(this.searchInput.value);

    fromEvent<KeyboardEvent>(this.searchInput, 'keydown').subscribe(
      (keydown) => {
        switch (keydown.key) {
          case 'ArrowUp':
            if (this.hints) {
              this.hintSelectedIndex--;
            }
            break;
          case 'ArrowDown':
            if (this.hints) {
              this.hintSelectedIndex++;
            }
            break;
          case 'Enter':
            this.submit(this.selectedHint);
            break;
          case 'Escape':
            console.log('blur');
            this.searchInput.blur();
            break;
          default:
            console.log('key', keydown.key);
            break;
        }
        if (this.hintSelectedIndex < 0) {
          this.hintSelectedIndex = -1;
        }
        if (this.hints) {
          if (this.hintSelectedIndex > this.hints.length) {
            this.hintSelectedIndex = this.hints.length;
          }
        }
      },
    );

    fromEvent(this.searchInput, 'input')
      .pipe(
        map(() => this.searchInput.value),
        tap(updateTypeAheadState),
        tap((search) => (this.isLoading = search.length >= minCharacters)),
        debounceTime(200),
        switchMap(async (val) =>
          val.length >= minCharacters ? this.searchAction(val) : undefined,
        ),
        tap(() => (this.isLoading = false)),
      )
      .subscribe((hints) => (this.hints = hints));
  }

  private async hintClicked(event: MouseEvent, hint: TypeAheadHint) {
    event.preventDefault();
    this.searchInput.focus();
    this.submit(hint);
  }

  private submit(hint: TypeAheadHint | undefined) {
    if (hint) {
      const submitEvent = new CustomEvent('submit', {
        bubbles: true,
        composed: true,
        detail: hint,
      });
      this.dispatchEvent(submitEvent);
    }
  }

  public override blur() {
    this.searchInput.blur();
  }

  public clear() {
    this.setSearchValue('');
  }

  public setSearchValue(value: string) {
    this.searchInput.value = value;
    const event = new InputEvent('input');
    this.searchInput.dispatchEvent(event);
  }

  override render() {
    return html`<div class="row mb-3 dropdown">
      <div class="col">
        <div class="form-floating flex-grow-1">
          <input
            type="email"
            class="form-control"
            .value="${this.textValue}"
            id="searchPersoonInput"
            placeholder="${this.placeholder}"
            ${ref(this.searchRef)}
          />
          <label for="searchPersoonInput">${this.placeholder}</label>
        </div>
      </div>
      <ul
        class="dropdown-menu ${this.typeAheadShow ? 'show' : ''}"
        aria-labelledby="dropdownMenuLink"
      >
        ${this.hints?.map((hint, index) => {
          const selected = index === this.hintSelectedIndex;
          return html`<li>
            <a
              @click="${(event: MouseEvent) => this.hintClicked(event, hint)}"
              class="dropdown-item ${selected ? 'active' : ''}"
              href="#"
              >${selected
                ? hint.text
                : this.getHintParts(hint).map(({ highlighted, text }) =>
                    highlighted
                      ? html`<span class="text-primary">${text}</span>`
                      : text,
                  )}</a
            >
          </li>`;
        })}
        ${this.hints?.length === 0
          ? html`<li>
              <a class="dropdown-item disabled" href="#"
                >Geen
                ${this.entityName
                  ? ` ${pluralize(this.entityName)}`
                  : ''}gevonden</a
              >
            </li>`
          : ''}
        ${this.isLoading
          ? html`<li>
              <a class="dropdown-item disabled" href="#">Loading....</a>
            </li>`
          : ''}
        ${this.charactersRemaining
          ? html`<li>
              <a class="dropdown-item disabled" href="#"
                >Type nog ${this.charactersRemaining} letters.</a
              >
            </li>`
          : ''}
      </ul>
    </div>`;
  }

  private getHintParts(hint: TypeAheadHint): TypeAheadTextPart[] {
    const textParts: TypeAheadTextPart[] = [];
    const re = new RegExp(escapeRegExp(this.searchInput.value), 'ig');
    const matches = hint.text.matchAll(re);
    let offset = 0;
    if (matches) {
      for (const match of matches) {
        const [part] = match;
        textParts.push({
          text: hint.text.substring(offset, match.index),
          highlighted: false,
        });
        textParts.push({
          text: part!,
          highlighted: true,
        });
        offset = match.index! + part!.length;
      }
    }
    textParts.push({ text: hint.text.substr(offset), highlighted: false });
    return textParts;
  }
}
