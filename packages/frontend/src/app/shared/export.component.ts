import { EntityFrom, FilterFrom, RestRoutes } from '@rock-solid/shared';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { downloadCsv } from './string-utils';
import { PagedStore } from './paged-store.store';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';

@customElement('rock-export')
export class ExportComponent<
  TRoute extends keyof RestRoutes,
> extends RockElement {
  public static override styles = [
    bootstrap,
    css`
      :host {
        display: inline-block;
      }
    `,
  ];

  @state()
  private exportIsLoading = false;

  @property({ attribute: false })
  private store!: PagedStore<TRoute>;

  @property({ attribute: false })
  private filter!: FilterFrom<TRoute>;

  @property({ attribute: false })
  private toCsv!: (items: EntityFrom<TRoute>[]) => string;

  @property()
  private exportTitle?: string;

  @state()
  private totalCount = 0;

  private async download() {
    this.exportIsLoading = true;
    const items = await this.store.service.getAll(this.filter);
    this.exportIsLoading = false;
    downloadCsv(this.toCsv(items), this.exportTitle);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      this.store.totalCount$.subscribe((count) => {
        this.totalCount = count;
      }),
    );
  }

  override render() {
    return html` <button
      type="button"
      class="btn btn-outline-secondary"
      ?disabled=${this.exportIsLoading || !this.totalCount}
      @click=${() => this.download()}
    >
      ${this.exportIsLoading
        ? html` <span
              class="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>
            <span role="status">Loading...</span>`
        : html`<rock-icon icon="download"></rock-icon> Export
            (${this.totalCount})`}
    </button>`;
  }
}
