import { escapeRegExp } from '@rock-solid/shared';
import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  Subscription,
  fromEvent,
  map,
  tap,
  debounceTime,
  switchMap,
} from 'rxjs';
import { pluralize } from './utility.pipes';

interface TypeAheadTextPart {
  text: string;
  highlighted: boolean;
}
export interface TypeAheadHint<TValue = number | string> {
  value: TValue;
  text: string;
}

export enum FocusState {
  None,
  Focus,
  Hover,
  HoverAndFocus,
}

export enum FocusStateTransition {
  Focus,
  Blur,
  Enter,
  Leave,
}

@customElement('rock-autocomplete')
export class AutocompleteComponent extends LitElement {
  @state()
  private isLoading = false;
  @state()
  private charactersRemaining: undefined | number;
  @state()
  public focusState = FocusState.None;
  @state()
  private hintSelectedIndex = -1;
  @state()
  private hints: TypeAheadHint[] | undefined;

  @property({ attribute: false })
  public searchAction!: (text: string) => Promise<TypeAheadHint[]>;

  @property({ type: Number })
  public minCharacters = 2;

  @property()
  public entityName?: string;

  private transitionState(transition: FocusStateTransition) {
    let newState: FocusState;
    const currentHover =
      this.focusState === FocusState.HoverAndFocus ||
      this.focusState === FocusState.Hover;
    const currentFocus =
      this.focusState === FocusState.HoverAndFocus ||
      this.focusState === FocusState.Focus;

    switch (transition) {
      case FocusStateTransition.Blur:
        newState = currentHover ? FocusState.Hover : FocusState.None;
        break;
      case FocusStateTransition.Focus:
        newState = currentHover ? FocusState.HoverAndFocus : FocusState.Focus;
        break;
      case FocusStateTransition.Enter:
        newState = currentFocus ? FocusState.HoverAndFocus : FocusState.Hover;
        break;
      case FocusStateTransition.Leave:
        newState = currentFocus ? FocusState.Focus : FocusState.None;
        break;
    }
    this.focusState = newState;
  }

  override createRenderRoot() {
    // Use light dom, so input will be localized on screen using bootstrap styling
    return this;
  }

  get selectedHint(): TypeAheadHint | undefined {
    return this.hints?.[this.hintSelectedIndex];
  }
  static override styles = [
    css`
      .dropdown-menu {
        top: 60px;
        width: 300px;
        left: 12px;
      }
    `,
  ];

  private searchInput!: HTMLInputElement;

  private subscription?: Subscription;

  public override connectedCallback(): void {
    super.connectedCallback();
    const searchInput = this.findSearchInput();
    this.searchInput = searchInput;
    this.subscription = new Subscription();

    const updateTypeAheadState = (value: string) => {
      if (value.length < this.minCharacters) {
        this.charactersRemaining = this.minCharacters - value.length;
        this.hints = undefined;
      } else {
        this.charactersRemaining = undefined;
      }
    };
    updateTypeAheadState(this.searchInput.value);

    this.subscription.add(
      fromEvent(this.searchInput, 'focus').subscribe(() => {
        this.transitionState(FocusStateTransition.Focus);
        // Force update
        this.searchInput.dispatchEvent(new InputEvent('input'));
      }),
    );
    this.subscription.add(
      fromEvent(this.searchInput, 'blur').subscribe(() => {
        // Allow click event in the dropdown to be handled
        this.transitionState(FocusStateTransition.Blur);
      }),
    );
    this.subscription.add(
      fromEvent(this, 'mouseenter').subscribe(() => {
        this.transitionState(FocusStateTransition.Enter);
      }),
    );
    this.subscription.add(
      fromEvent(this, 'mouseleave').subscribe(() => {
        this.transitionState(FocusStateTransition.Leave);
      }),
    );

    this.subscription.add(
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
              keydown.preventDefault(); // Don't submit the form!
              break;
            case 'Escape':
              this.searchInput.blur();
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
      ),
    );

    this.subscription.add(
      fromEvent(this.searchInput, 'input')
        .pipe(
          map(() => this.searchInput.value),
          tap(updateTypeAheadState),
          tap(
            (search) => (this.isLoading = search.length >= this.minCharacters),
          ),
          debounceTime(200),
          switchMap(async (val) =>
            val.length >= this.minCharacters
              ? this.searchAction(val)
              : undefined,
          ),
          tap(() => (this.isLoading = false)),
        )
        .subscribe((hints) => {
          this.hints = hints;
        }),
    );
  }

  private findSearchInput() {
    let searchInput: HTMLInputElement | null = null;
    let container = this.parentElement;
    while (searchInput === null && container) {
      searchInput = container.querySelector('input');
      container = container.parentElement;
    }
    if (!searchInput) {
      throw new Error(
        `Cannot locate input for auto complete from ${
          this.parentElement!.tagName
        }`,
      );
    }
    return searchInput;
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  private hintClicked(event: MouseEvent, hint: TypeAheadHint) {
    event.preventDefault();
    this.submit(hint);
  }

  private submit(hint: TypeAheadHint | undefined) {
    if (hint) {
      this.dispatchEvent(
        new CustomEvent('selected', {
          bubbles: true,
          composed: true,
          detail: hint,
        }),
      );
    }
  }

  override render() {
    return html`<ul
    class="dropdown-menu ${this.focusState === FocusState.None ? '' : 'show'}"
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
    ${
      this.hints?.length === 0
        ? html`<li>
            <a class="dropdown-item disabled" href="#"
              >Geen
              ${this.entityName
                ? ` ${pluralize(this.entityName)}`
                : ''}gevonden</a
            >
          </li>`
        : ''
    }
    ${
      this.isLoading
        ? html`<li>
            <a class="dropdown-item disabled" href="#">Loading....</a>
          </li>`
        : ''
    }
    ${
      this.charactersRemaining
        ? html`<li>
            <a class="dropdown-item disabled" href="#"
              >Type nog ${this.charactersRemaining} letters.</a
            >
          </li>`
        : ''
    }
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
          text: part,
          highlighted: true,
        });
        offset = match.index + part.length;
      }
    }
    textParts.push({ text: hint.text.substr(offset), highlighted: false });
    return textParts;
  }
}
