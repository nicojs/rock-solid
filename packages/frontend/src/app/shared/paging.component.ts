import { PAGE_SIZE } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';

const MAX_PAGE_BUTTON_COUNT = 10;

@customElement('rock-paging')
export class PagingComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public currentPage = 0;
  @property()
  public totalCount = 0;

  private clickPage(page: number) {
    const event = new CustomEvent('navigate-page', {
      bubbles: true,
      composed: true,
      detail: page,
    });
    this.dispatchEvent(event);
  }

  override render() {
    const pageButtons: number[] = [];
    const half = MAX_PAGE_BUTTON_COUNT / 2;
    const maxPage = Math.ceil(this.totalCount / PAGE_SIZE) - 1;
    let start = this.currentPage - half;
    let end = this.currentPage + half;
    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > maxPage) {
      start -= end - maxPage;
      if (start < 0) {
        start = 0;
      }
      end = maxPage;
    }
    for (let i = start; i <= end; i++) {
      pageButtons.push(i);
    }
    const hasFirst = start > 0;
    const hasPrevious = this.currentPage > 0;
    const hasNext = this.currentPage < maxPage;
    const nextPage = this.currentPage + 1;
    const previousPage = this.currentPage - 1;
    const hasLast = end < maxPage;

    return html`<nav aria-label="page navigation">
      <ul class="pagination justify-content-center">
        ${hasFirst
          ? html`<li class="page-item">
              <button class="page-link" @click=${() => this.clickPage(0)}>
                Eerste
              </button>
            </li>`
          : ''}
        <li class="page-item ${hasPrevious ? '' : 'disabled'}">
          <button
            class="page-link"
            @click=${() => this.clickPage(previousPage)}
          >
            Vorige
          </button>
        </li>
        ${pageButtons.map(
          (button) =>
            html`<li
              class="page-item ${this.currentPage === button ? 'disabled' : ''}"
            >
              <button class="page-link" @click=${() => this.clickPage(button)}>
                ${button + 1}
              </button>
            </li>`,
        )}
        <li class="page-item ${hasNext ? '' : 'disabled'}">
          <button class="page-link" @click=${() => this.clickPage(nextPage)}>
            Volgende
          </button>
        </li>
        ${hasLast
          ? html`<li class="page-item ${hasNext ? '' : 'disabled'}">
              <button class="page-link" @click=${() => this.clickPage(maxPage)}>
                Laatste
              </button>
            </li>`
          : ''}
      </ul>
    </nav> `;
  }
}
