import { css, html, LitElement } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { debounceTime, filter, fromEvent, map, switchMap, tap } from 'rxjs';
import { escapeRegExp } from '@kei-crm/shared';

interface TypeAheadTextPart {
  text: string;
  highlighted: boolean;
}
export interface TypeAheadHint {
  value: number | string;
  text: string;
}
const minCharacters = 2;

@customElement('kei-autocomplete')
export class AutocompleteComponent extends LitElement {
  private searchRef = createRef<HTMLInputElement>();

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

  @property({ attribute: false })
  public submitAction!: (selected: TypeAheadHint) => Promise<void>;

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
    const input = this.searchRef.value as HTMLInputElement;
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
    updateTypeAheadState(input.value);

    fromEvent<KeyboardEvent>(input, 'keydown').subscribe((keydown) => {
      if (this.hints) {
        switch (keydown.key) {
          case 'ArrowUp':
            this.hintSelectedIndex--;
            break;
          case 'ArrowDown':
            this.hintSelectedIndex++;
            break;
          case 'Enter':
            this.submit(this.selectedHint);
            break;
          case 'Escape':
            input.blur();
            break;
          default:
            console.log('key', keydown.key);
            break;
        }
      }
      if (this.hintSelectedIndex < 0) {
        this.hintSelectedIndex = -1;
      }
      if (this.hints) {
        if (this.hintSelectedIndex > this.hints.length) {
          this.hintSelectedIndex = this.hints.length;
        }
      }
    });

    fromEvent(input, 'input')
      .pipe(
        map(() => input.value),
        tap(updateTypeAheadState),
        filter((search) => search.length >= minCharacters),
        tap(() => (this.isLoading = true)),
        debounceTime(200),
        switchMap((val) => this.searchAction(val)),
        tap(() => (this.isLoading = false)),
      )
      .subscribe((hints) => (this.hints = hints));
  }

  private async hintClicked(event: MouseEvent, hint: TypeAheadHint) {
    event.preventDefault();
    await this.submit(hint);
    this.searchRef.value?.focus();
  }

  private async submit(hint: TypeAheadHint | undefined) {
    if (hint) {
      await this.submitAction(hint);
      this.searchRef.value!.value = '';
      const event = new InputEvent('input');
      this.searchRef.value!.dispatchEvent(event);
    }
  }

  override render() {
    return html`<div class="row mb-3 dropdown">
      <div class="col">
        <div class="form-floating flex-grow-1">
          <input
            type="email"
            class="form-control"
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
                >Geen deelnemers gevonden</a
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
    const re = new RegExp(escapeRegExp(this.searchRef.value!.value), 'ig');
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
