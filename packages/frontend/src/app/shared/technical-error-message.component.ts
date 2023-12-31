import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';

@customElement('rock-technical-error-message')
export class TechnicalErrorMessage extends LitElement {
  static override styles = [bootstrap];

  @property()
  private technicalDetails: string | undefined;

  @state()
  private collapseState:
    | 'show'
    | 'collapsing-hide'
    | 'collapsing-show'
    | 'hide' = 'hide';

  @state()
  private collapseHeight?: number;

  override render() {
    return html`<p>
        Er is een technische fout opgetreden. Excuses voor het ongemak.
        <a
          href="javascript:window.reload()"
          @click="${(event: Event) => {
            event.preventDefault();
            this.reloadWindow();
          }}"
          >Herlaadt de pagina</a
        >
        en probeer het opnieuw. Als dit vaker voorkomt, laat het dan weten aan
        Nico Jansen.
      </p>
      ${this.renderTechnicalDetails()}`;
  }

  private reloadWindow() {
    window.location.reload();
  }

  private toggleShowDetails() {
    if (this.collapseState === 'show') {
      this.collapseState = 'collapsing-hide';
      this.collapseHeight = 80;
      setTimeout(() => {
        this.collapseHeight = 0;
        setTimeout(() => {
          this.collapseState = 'hide';
          this.collapseHeight = undefined;
        }, 350);
      });
    }
    if (this.collapseState === 'hide') {
      this.collapseState = 'collapsing-show';
      this.collapseHeight = 0;
      setTimeout(() => {
        this.collapseHeight = 80;
        setTimeout(() => {
          this.collapseState = 'show';
        }, 350);
      });
    }
  }

  get collapsed() {
    return (
      this.collapseState === 'hide' || this.collapseState === 'collapsing-hide'
    );
  }

  get collapsing() {
    return (
      this.collapseState === 'collapsing-hide' ||
      this.collapseState === 'collapsing-show'
    );
  }

  private renderTechnicalDetails() {
    if (this.technicalDetails) {
      return html`<div class="accordion" id="accordionExample">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button ${this.collapsed ? 'collapsed' : ''}"
              type="button"
              aria-expanded="${!this.collapsed ? 'true' : 'false'}"
              aria-controls="collapseOne"
              @click="${() => this.toggleShowDetails()}"
            >
              Technische details
            </button>
          </h2>
          <div
            id="collapseOne"
            class="accordion-collapse ${this.collapsing
              ? 'collapsing'
              : 'collapse'} ${this.collapseState === 'show' ? 'show' : ''}"
            style="${this.collapseHeight
              ? `height: ${this.collapseHeight}px`
              : ''}"
          >
            <div class="accordion-body">${this.technicalDetails}</div>
          </div>
        </div>
      </div>`;
    }
    return nothing;
  }
}
