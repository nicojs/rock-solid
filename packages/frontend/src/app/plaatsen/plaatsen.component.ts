import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import { html, nothing } from 'lit';
import { plaatsService, show } from '../shared';
import { fromCsv } from '@rock-solid/shared';
import { privilege } from '../auth/privilege.directive';

@customElement('rock-plaatsen')
export class PlaatsenComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false })
  public query?: { page: string; search?: string };

  @state()
  private loading = false;

  @state()
  private successMessage?: string;

  @state()
  private errorMessage?: string;

  @state()
  private selectedRows?: PlaatsCsvRow[];

  @state()
  private plaatsCount?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#updatePlaatsCount();
  }

  #updatePlaatsCount() {
    this.plaatsCount = undefined;
    plaatsService.getPage(1).then((p) => (this.plaatsCount = p.totalCount));
  }

  override render() {
    return html`
      <h1>
        Plaatsen beheer ${this.plaatsCount ? `(${this.plaatsCount})` : nothing}
      </h1>

      ${this.successMessage
        ? html`<rock-alert
            emphasis="success"
            .message=${this.successMessage}
          ></rock-alert>`
        : ''}
      ${this.errorMessage
        ? html`<rock-alert .message=${this.errorMessage}></rock-alert>`
        : ''}

      <div class="row">
        <div class="col">
          <details class="alert alert-info">
            <summary>Uitleg</summary>
            <p>
              Upload een CSV bestand met plaatsen om de database bij te werken.
              Let op: Je moet admin zijn om dit te kunnen.
            </p>
            <ol>
              <li>
                Download de excel van
                <a
                  href="https://www.bpost.be/nl/postcodevalidatie-tool"
                  target="_blank"
                  >https://www.bpost.be/nl/postcodevalidatie-tool</a
                >
              </li>
              <li>
                Controleer dat de headers zo heten: ${show(plaatsCsvHeaders)}
                (extra headers mogen)
              </li>
              <li>Converteer deze naar een csv (via 'opslaan als')</li>
              <li>Upload the file hier</li>
              <li>Rock Solid zal de plaatsen in de database bijwerken:
                <ul>
                  <li>Nieuwe plaatsen worden toegevoegd</li>
                  <li>Bestaande plaatsen worden geüpdatet (geïdentificeerd op postcode en deelgemeente)</li>
                </ul>
              </li>
            </ol>
          </details>
        </div>
      </div>

      <div class="row">
        <div class="card mb-4">
          <div class="card-body">
            <h2 class="card-title h5">CSV bestand uploaden</h2>

            <div class="mb-3">
              <label for="csvFile" class="form-label"
                >Selecteer CSV bestand</label
              >
              <input
                class="form-control"
                type="file"
                ${privilege('custom:manage-plaatsen')}
                id="csvFile"
                accept=".csv,text/csv"
                @change=${(event: Event) => this.handleFileSelect(event)}
                ?disabled=${this.loading}
              />
            </div>

            ${this.selectedRows
              ? html`
                  <div class="mb-3">
                    <p>
                      <strong>Geselecteerd bestand:</strong>
                      ${this.selectedRows.length} postcodes
                    </p>
                  </div>
                `
              : ''}

            <button
              class="btn btn-primary"
              ${privilege('custom:manage-plaatsen')}
              @click=${() => this.handleUpload()}
              ?disabled=${!this.selectedRows || this.loading}
            >
              ${this.loading ? 'Uploaden...' : 'Upload CSV'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const csvContent = await this.readFileAsText(input.files[0]!);
      try {
        this.selectedRows = fromCsv(plaatsCsvHeaders, csvContent).filter(
          (row) => row.Postcode.trim() !== '0612', // Sinterklaas 🤦
        );
        this.errorMessage = undefined;
      } catch (err) {
        this.errorMessage =
          err instanceof Error ? err.message : 'Onbekende fout opgetreden';
      }
    }
  }

  private async handleUpload() {
    if (!this.selectedRows) {
      return;
    }

    this.loading = true;
    this.successMessage = undefined;
    this.errorMessage = undefined;

    try {
      const hoofdgemeenteMap = new Map<string, string>();
      this.selectedRows.forEach(({ Hoofdgemeente, Plaatsnaam }) => {
        if (Hoofdgemeente === Plaatsnaam.toUpperCase()) {
          hoofdgemeenteMap.set(Hoofdgemeente, Plaatsnaam);
        }
      });

      const plaatsen = this.selectedRows.map(
        ({ Plaatsnaam, Hoofdgemeente, Postcode }) => ({
          deelgemeente: Plaatsnaam,
          // gemeente is in ALL CAPS for some reason, fix that using the map
          gemeente:
            hoofdgemeenteMap.get(Hoofdgemeente) ??
            forceToPascalCase(Hoofdgemeente),
          postcode: Postcode,
        }),
      );
      await plaatsService.batchUpdate(plaatsen);
      this.successMessage = 'CSV bestand succesvol geüpload!';
      this.selectedRows = undefined;
      this.#updatePlaatsCount();
      // Reset the file input
      const fileInput = this.shadowRoot?.querySelector(
        '#csvFile',
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Er is een fout opgetreden bij het uploaden van het bestand.';
    } finally {
      this.loading = false;
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Could not read file'));
        }
      };
      reader.onerror = () => reject(reader.error!);
      reader.readAsText(file);
    });
  }
}

const plaatsCsvHeaders = Object.freeze([
  'Postcode',
  'Plaatsnaam',
  'Hoofdgemeente',
] as const);
type PlaatsCsvRow = Record<(typeof plaatsCsvHeaders)[number], string>;

const denyListForPascalCase = new Set([
  'van',
  'de',
  'der',
  'den',
  'het',
  'in',
  'te',
  'ten',
  'ter',
  'en',
]);
function forceToPascalCase(name: string): any {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) =>
          denyListForPascalCase.has(part)
            ? part
            : part.charAt(0).toUpperCase() + part.slice(1).toLocaleLowerCase(),
        )
        .join('-'),
    )
    .join(' ');
}
