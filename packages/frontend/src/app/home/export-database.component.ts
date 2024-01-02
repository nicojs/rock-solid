import { customElement, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { css, html, nothing } from 'lit';
import { authStore } from '../auth';
import { bootstrap } from '../../styles';
import { privilege } from '../auth/privilege.directive';

@customElement('rock-export-database')
export class ExportDatabaseComponent extends RockElement {
  @state()
  private enableDownloadInstructions = false;

  @state()
  private authToken?: string;

  static override styles = [
    bootstrap,
    css`
      .hljs-string {
        color: #50a14f;
      }
      .hljs-comment {
        color: #a0a1a7;
        font-style: italic;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      authStore.jwt$.subscribe((jwt) => {
        this.authToken = jwt;
      }),
    );
  }

  override render() {
    return html`<div>
      <button
        @click=${() => (this.enableDownloadInstructions = true)}
        ${privilege('read:backup')}
        class="btn btn-outline-secondary"
      >
        <rock-icon icon="download"></rock-icon> Export database backup
      </button>
      ${this.renderDownloadInstructions()}
    </div>`;
  }

  private renderDownloadInstructions() {
    if (!this.enableDownloadInstructions) {
      return nothing;
    }
    if (!this.authToken) {
      return html`<p class="text-danger">
        Je moet ingelogd zijn om een database backup te kunnen downloaden.
      </p>`;
    }
    const { protocol, host } = window.location;
    return html`<p class="mt-3">Technische instructies voor de beheerder:</p>
      <pre
        class="bg-secondary-subtle"
      ><span class="hljs d-block mb-0 p-4 block min-h-full overflow-auto"><code>curl -H <span class="hljs-string">'Authorization: Bearer ${this.authToken}'</span> --output backup.db ${protocol}//${host}/api/backup
sqlite3 backup.db .schema <span class="hljs-comment"># a test to see if the file is valid</span></code></pre>`;
  }
}
