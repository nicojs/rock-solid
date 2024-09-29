import { customElement, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { PropertyValueMap, css, html } from 'lit';
import { bootstrap } from '../../styles';
import { capitalize } from '../shared';

type ThemeChoice = 'light' | 'dark' | 'auto';
export type Theme = Exclude<ThemeChoice, 'auto'>;
const themes: ThemeChoice[] = ['light', 'dark', 'auto'];

const themeIcons: Record<ThemeChoice, string> = {
  light: 'sunFill',
  dark: 'moonStarsFill',
  auto: 'circleHalf',
};

@customElement('rock-theme-toggle')
export class ThemeToggleComponent extends RockElement {
  static override styles = [
    bootstrap,
    css`
      .btn {
        border-radius: 0;
      }
    `,
  ];

  @state()
  private open = false;

  @state()
  private theme: ThemeChoice = 'auto';

  constructor() {
    super();
    const theme = localStorage.getItem('theme') as ThemeChoice;
    if (themes.includes(theme)) {
      this.setTheme(theme);
    }
  }

  public setTheme(theme: ThemeChoice) {
    this.theme = theme;
    this.open = false;
    localStorage.setItem('theme', theme);
    this.dispatchThemeChangedEvent(this.#determineConcreteTheme(theme));
  }

  #darkMatch = window.matchMedia('(prefers-color-scheme: dark)');

  #updateTheme = () => {
    this.setTheme(this.theme);
  };

  protected override firstUpdated(
    props: PropertyValueMap<ThemeToggleComponent>,
  ): void {
    super.firstUpdated(props);
    this.#updateTheme();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#darkMatch.addEventListener('change', this.#updateTheme);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#darkMatch.removeEventListener('change', this.#updateTheme);
  }

  #determineConcreteTheme(theme: ThemeChoice): Theme {
    if (theme === 'auto') {
      if (this.#darkMatch.matches) {
        return 'dark';
      }
      return 'light';
    }
    return theme;
  }

  private dispatchThemeChangedEvent(theme: Theme) {
    this.dispatchEvent(
      new CustomEvent('theme-changed', {
        bubbles: true,
        composed: true,
        detail: theme,
      }),
    );
  }

  get activeThemeIcon() {
    switch (this.theme) {
      case 'light':
        return 'sunFill';
      case 'dark':
        return 'moonStarsFill';
      case 'auto':
        return 'circleHalf';
    }
  }

  protected override render() {
    const iconClass = 'opacity-50 me-2';
    return html`<button
        class="${this.open
          ? 'active'
          : ''} bg-body-tertiary btn btn-link nav-link py-2 px-0 px-lg-2 dropdown-toggle d-flex align-items-center"
        type="button"
        aria-label="Toggle theme (dark)"
        @click=${() => (this.open = !this.open)}
      >
        <rock-icon .icon=${this.activeThemeIcon}></rock-icon>
        <span class="d-lg-none ms-2" id="bd-theme-text">Toggle theme</span>
      </button>
      <ul
        style="right: 3px;"
        class="dropdown-menu dropdown-menu-end ${this.open
          ? 'show'
          : ''} d-static"
      >
        ${Object.entries(themeIcons).map(([themeKey, icon]) => {
          const theme = themeKey as ThemeChoice;
          return html` <li>
            <button
              type="button"
              class="dropdown-item d-flex align-items-center ${theme ===
              this.theme
                ? 'active'
                : ''}"
              @click=${() => this.setTheme(theme)}
              aria-pressed="false"
            >
              <rock-icon class="${iconClass}" .icon=${icon}></rock-icon>
              ${capitalize(theme)}
            </button>
          </li>`;
        })}
      </ul> `;
  }
}
