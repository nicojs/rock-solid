import { TemplateResult, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { router } from '../router';

type ModalKind = 'confirm' | 'alert';

@customElement('rock-modal')
export class ModalComponent extends RockElement {
  constructor() {
    super();
    ModalComponent.instance = this;
  }

  static override styles = [bootstrap];

  static instance: ModalComponent;

  private currentResolveFn?: (value: unknown) => void;

  private confirmed = (event: MouseEvent) => {
    event.stopPropagation();
    this.shown = false;
    this.currentResolveFn!(this.kind === 'confirm' ? true : undefined);
  };
  private cancelled = (event: MouseEvent) => {
    event.stopPropagation();
    this.shown = false;
    this.currentResolveFn!(false);
  };

  public confirm(
    question: string | TemplateResult,
    title = 'Weet je het zeker?',
  ): Promise<boolean> {
    return new Promise((res) => {
      this.kind = 'confirm';
      this.modalBody = question;
      this.modalTitle = title;
      this.shown = true;
      this.currentResolveFn = res as (value: unknown) => void;
    });
  }
  public alert(body: TemplateResult, title = 'Oops!'): Promise<void> {
    return new Promise((res) => {
      this.kind = 'alert';
      this.modalBody = body;
      this.modalTitle = title;
      this.shown = true;
      this.currentResolveFn = res as (value: unknown) => void;
    });
  }

  public override connectedCallback() {
    super.connectedCallback();
    router.routeChange$.subscribe(() => {
      this.shown = false;
    });
  }

  @state()
  private kind: ModalKind = 'confirm';

  @state()
  private shown = false;

  @state()
  private modalBody: string | TemplateResult = '';

  @state()
  private modalTitle = '';

  override render() {
    const showClasses = { show: this.shown, fade: this.shown };
    const displayStyle = this.shown ? { display: 'block' } : {};
    return html`<div
        @click=${this.cancelled}
        class="modal ${classMap(showClasses)}"
        style=${styleMap(displayStyle)}
        tabindex="-1"
        role="dialog"
      >
        <div class="modal-dialog" role="document">
          <div
            class="modal-content"
            @click=${(event: MouseEvent) => event.stopPropagation()}
          >
            <div class="modal-header">
              <h5 class="modal-title">${this.modalTitle}</h5>
              <button
                @click=${this.cancelled}
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <p>${this.modalBody}</p>
            </div>
            <div class="modal-footer">${this.renderFooter()}</div>
          </div>
        </div>
      </div>
      ${this.shown
        ? html`<div
            class="modal-backdrop fade ${classMap({ show: this.shown })}"
          ></div>`
        : nothing} `;
  }
  renderFooter() {
    switch (this.kind) {
      case 'confirm':
        return html`<button
            @click=${this.confirmed}
            type="button"
            class="btn btn-primary"
          >
            Ja
          </button>
          <button
            @click=${this.cancelled}
            type="button"
            class="btn btn-secondary"
            data-dismiss="modal"
          >
            Annuleren
          </button>`;
      case 'alert':
        return html`<button
          @click=${this.confirmed}
          type="button"
          class="btn btn-primary"
        >
          Ok
        </button>`;
    }
  }
}
