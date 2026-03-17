import {
  Aanmelding,
  Deelnemer,
  Locatie,
  Vervoerstoer,
} from '@rock-solid/shared';
import { css, html, nothing, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { selectControl, tagsControl } from '../forms';
import { formStyles } from '../forms/reactive-form.component';
import { showLocatie } from '../locaties/locatie.pipe';
import { locatieService } from '../locaties/locatie.service';
import { fullName } from '../personen/persoon.pipe';
import { RockElement } from '../rock-element';
import { deelnemerLink } from '../projecten/project.pipes';
import { bootstrap } from '../../styles';

@customElement('rock-opstapplaatsen-kiezen')
export class OpstapplaatsenKiezenComponent extends RockElement {
  static override styles = [
    bootstrap,
    formStyles,

    css`
      .text-vertical {
        padding: 0.25rem;
      }
      .text-vertical-label {
        display: block;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        max-height: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .sticky-first-column {
        position: sticky;
        left: 0;
        background-color: var(--bs-body-bg);
      }
      .sticky-first-column-header {
        z-index: 901;
      }
      .table-hover tbody tr:hover > .sticky-first-column {
        background-color: var(--bs-table-hover-bg);
      }
      table {
        table-layout: fixed;
      }
    `,
  ];

  @property({ attribute: false })
  deelnemers: Deelnemer[] = [];

  @property({ attribute: false })
  opstapplaatsen: Locatie[] = [];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @property({ attribute: false })
  bestemmingLocaties: Locatie[] = [];

  @property({ attribute: false })
  aanmeldingenPerDeelnemerId: Map<number, Aanmelding[]> = new Map();

  @property({ type: Boolean })
  isLoading = false;

  @property({ type: Boolean })
  enkelVakanties = false;

  @property({ type: Boolean })
  step2Enabled = false;

  protected override update(
    changedProperties: PropertyValues<OpstapplaatsenKiezenComponent>,
  ): void {
    if (changedProperties.has('opstapplaatsen')) {
      this.dispatchEvent(
        new CustomEvent<Locatie[]>('opstapplaatsen-changed', {
          detail: this.opstapplaatsen,
          bubbles: true,
          composed: true,
        }),
      );
    }
    super.update(changedProperties);
  }

  override render() {
    return html`${this.#renderUitleg()}
      <div class="row mb-3 z-index-9999">
        <div class="col mb-3">
          <rock-reactive-form-tags
            .entity=${this}
            .control=${tagsControl<
              OpstapplaatsenKiezenComponent,
              'opstapplaatsen'
            >(
              'opstapplaatsen',
              (loc) => loc.naam,
              async (text) => {
                const locaties = await locatieService.getAll({
                  soort: 'opstapplaats',
                  naam: text,
                  geschiktVoorVakantie: this.enkelVakanties || undefined,
                });
                return locaties.map((loc) => ({
                  text: loc.naam,
                  value: loc,
                }));
              },
              { label: 'Opstapplaatsen' },
            )}
          >
          </rock-reactive-form-tags>
        </div>
      </div>
      <div class="row mb-3">${this.#renderBestemmingInput()}</div>
      <div class="row">
        <div class="col mb-3">
          <div class="d-flex gap-3 align-items-center">
            <strong>Legenda:</strong>
            <span>
              <rock-icon icon="checkCircle" class="text-success"></rock-icon>
              Gekozen opstapplaats
            </span>
            <span>
              <rock-icon icon="circle"></rock-icon>
              Mogelijke opstapplaats
            </span>
            <span>
              <rock-icon icon="dashCircle"></rock-icon>
              Geen mogelijke opstapplaats
            </span>
          </div>
        </div>
        <div class="row mb-3">
          ${this.deelnemers.length === 0
            ? html`<p class="alert alert-info">
                Deze projecten hebben nog geen deelnemers met status 'Aangemeld'
                of 'Bevestigd'.
              </p>`
            : this.deelnemers.every(
                  (deelnemer) => deelnemer.mogelijkeOpstapplaatsen.length === 0,
                )
              ? html`<p class="alert alert-info">
                  Deelnemers in deze projecten hebben nog geen mogelijke
                  opstapplaatsen.
                </p>`
              : nothing}

          <div class="col-12">
            <table class="table table-hover table-sm">
              <thead class="sticky-top z-index-900">
                <tr>
                  <th
                    style="width: 200px"
                    class="sticky-first-column sticky-first-column-header"
                  >
                    Deelnemer
                  </th>
                  ${this.opstapplaatsen.map(
                    (opstapplaats) =>
                      html`<th
                        title="${opstapplaats.naam}"
                        style="width: 40px"
                        class="text-vertical"
                      >
                        <span class="text-vertical-label"
                          >${opstapplaats.naam}</span
                        >
                      </th>`,
                  )}
                  ${this.vervoerstoer.bestemming
                    ? html`<th
                        title="Rechtstreeks naar ${this.vervoerstoer.bestemming
                          .naam}"
                        style="width: 40px"
                        class="text-vertical bg-dark-subtle"
                      >
                        <span class="text-vertical-label"
                          >${this.vervoerstoer.bestemming.naam}</span
                        >
                      </th>`
                    : nothing}
                  <th>Gekozen opstapplaats</th>
                </tr>
              </thead>
              <tbody>
                ${this.deelnemers.map((deelnemer) => {
                  if (!deelnemer) {
                    return nothing;
                  }
                  return html`
                    <tr>
                      <th class="fw-normal sticky-first-column">
                        ${deelnemerLink(deelnemer)}
                      </th>
                      ${this.opstapplaatsen.map((opstapplaats) =>
                        this.renderOpstapplaatsCell(deelnemer, opstapplaats),
                      )}
                      ${this.vervoerstoer.bestemming
                        ? this.renderOpstapplaatsCell(
                            deelnemer,
                            this.vervoerstoer.bestemming,
                          )
                        : nothing}
                      <td>
                        <select
                          class="form-select form-select-sm"
                          @change=${(ev: Event) => {
                            const select = ev.target as HTMLSelectElement;
                            const selectedId = Number(select.value);
                            const allLocaties = [
                              ...deelnemer.mogelijkeOpstapplaatsen,
                              ...(this.vervoerstoer.bestemming
                                ? [this.vervoerstoer.bestemming]
                                : []),
                            ];
                            const geselecteerdeLocatie = allLocaties.find(
                              (loc) => loc.id === selectedId,
                            );
                            const aanmeldingen =
                              this.aanmeldingenPerDeelnemerId.get(
                                deelnemer.id,
                              ) || [];
                            for (const aanmelding of aanmeldingen) {
                              aanmelding.opstapplaats = geselecteerdeLocatie;
                            }
                            this.notifyDataChanged();
                          }}
                        >
                          <option value="">Kies opstapplaats</option>
                          ${deelnemer.mogelijkeOpstapplaatsen
                            .filter((locatie) => locatie.soort !== 'cursushuis')
                            .map(
                              (locatie) =>
                                html`<option
                                  value="${locatie.id}"
                                  ?selected=${this.aanmeldingenPerDeelnemerId.get(
                                    deelnemer.id,
                                  )?.[0]?.opstapplaats?.id === locatie.id}
                                >
                                  ${showLocatie(locatie)}
                                </option>`,
                            )}
                          ${this.vervoerstoer.bestemming &&
                          deelnemer.mogelijkeOpstapplaatsen.some(
                            (loc) =>
                              loc.id === this.vervoerstoer.bestemming?.id,
                          )
                            ? html`<option
                                value="${this.vervoerstoer.bestemming.id}"
                                ?selected=${this.aanmeldingenPerDeelnemerId.get(
                                  deelnemer.id,
                                )?.[0]?.opstapplaats?.id ===
                                this.vervoerstoer.bestemming.id}
                              >
                                👉 Rechtstreeks naar
                                ${showLocatie(this.vervoerstoer.bestemming)}
                              </option>`
                            : nothing}
                        </select>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
            <div class="col">
              ${this.isLoading
                ? html`<rock-loading></rock-loading>`
                : html`
                    <button
                      class="btn btn-secondary"
                      @click=${() =>
                        this.dispatchEvent(
                          new CustomEvent('save-requested', {
                            bubbles: true,
                            composed: true,
                          }),
                        )}
                    >
                      <rock-icon icon="floppy"></rock-icon> Opslaan
                    </button>
                    <button
                      ?disabled=${!this.step2Enabled}
                      class="btn btn-primary ms-3"
                      @click=${() =>
                        this.dispatchEvent(
                          new CustomEvent('save-and-next-requested', {
                            bubbles: true,
                            composed: true,
                          }),
                        )}
                    >
                      <rock-icon icon="arrowRightCircle"></rock-icon> Opslaan en
                      volgende
                    </button>
                  `}
            </div>
          </div>
        </div>
      </div>`;
  }

  #renderBestemmingInput() {
    return html`<div class="col-lg-2 col-md-4">
        <label for="bestemming-input" class="form-label fw-bold">Bestemming</label>
      </div>
      <div class="col-lg-10 col-md-8">
        <select
          class="form-select"
          id="bestemming-input"
          @change=${(ev: Event) => {
            const select = ev.target as HTMLSelectElement;
            const selectedId = Number(select.value);
            const oldBestemmingId = this.vervoerstoer.bestemming?.id;
            const locatie = this.bestemmingLocaties.find(
              (l) => l.id === selectedId,
            );
            if (oldBestemmingId && oldBestemmingId !== locatie?.id) {
              for (const [, aanmeldingen] of this.aanmeldingenPerDeelnemerId) {
                for (const aanmelding of aanmeldingen) {
                  if (aanmelding.opstapplaats?.id === oldBestemmingId) {
                    aanmelding.opstapplaats = undefined;
                  }
                }
              }
            }
            this.vervoerstoer.bestemming = locatie;
            this.notifyDataChanged();
          }}
        >
          <option value="">Kies bestemming</option>
          ${this.bestemmingLocaties.map(
            (locatie) =>
              html`<option
                value="${locatie.id}"
                ?selected=${this.vervoerstoer.bestemming?.id === locatie.id}
              >
                ${showLocatie(locatie)}
              </option>`,
          )}
        </select>
      </div>`;
  }

  #renderUitleg() {
    return html`<details class="alert alert-info">
      <summary>Uitleg</summary>
      <p>
        Hieronder kun je mogelijke opstapplaatsen van de deelnemers beheren en
        een opstapplaats toewijzen per deelnemer.
      </p>
      <ol>
        <li>
          Gebruik het veld 'Opstapplaatsen' om beschikbare opstapplaatsen toe te
          voegen aan de vervoerstoer. Maak nieuwe opstapplaatsen aan via
          <a href="/locaties">Locaties beheren</a>
        </li>
        <li>
          Voor elke deelnemer in de tabel kun je de opstapplaatsen beheren door
          op de icoontjes te klikken.
          <ul>
            <li>
              <rock-icon icon="dashCircle"></rock-icon> Geen mogelijke
              opstapplaats.
            </li>
            <li>
              <rock-icon icon="circle"></rock-icon> Mogelijke opstapplaats.
            </li>
          </ul>
        </li>
        <li>
          Gebruik de dropdown in de laatste kolom om een opstapplaats te kiezen
          voor deze vervoerstoer.
        </li>
        <li>Klik op 'Opslaan' om je wijzigingen te bewaren.</li>
      </ol>
    </details>`;
  }

  private renderOpstapplaatsCell(deelnemer: Deelnemer, opstapplaats: Locatie) {
    const naam = fullName(deelnemer);
    const isBestemming = opstapplaats.id === this.vervoerstoer.bestemming?.id;
    const isMogelijkeOpstapplaats = deelnemer.mogelijkeOpstapplaatsen.some(
      (value) => value.id === opstapplaats.id,
    );
    return html`<td
      title="${isMogelijkeOpstapplaats
        ? `${naam} heeft ${showLocatie(opstapplaats)} als mogelijke opstapplaats`
        : `Click om ${showLocatie(opstapplaats)} als mogelijke opstapplaats toe te voegen voor ${naam}`}"
      class="text-center ${isBestemming ? 'bg-dark-subtle' : ''}"
    >
      ${isMogelijkeOpstapplaats
        ? html`<button
            class="btn btn-sm p-0"
            @click=${() => {
              deelnemer.mogelijkeOpstapplaatsen.splice(
                deelnemer.mogelijkeOpstapplaatsen.findIndex(
                  (value) => value.id === opstapplaats.id,
                ),
                1,
              );
              this.aanmeldingenPerDeelnemerId
                .get(deelnemer.id)
                ?.forEach((aanmelding) => {
                  if (aanmelding.opstapplaats?.id === opstapplaats.id) {
                    aanmelding.opstapplaats = undefined;
                  }
                });
              this.notifyDataChanged();
            }}
          >
            ${opstapplaats.id ===
            this.aanmeldingenPerDeelnemerId.get(deelnemer.id)?.[0]?.opstapplaats
              ?.id
              ? html`<rock-icon
                  icon="checkCircle"
                  class="text-success"
                ></rock-icon>`
              : html`<rock-icon icon="circle"></rock-icon>`}
          </button>`
        : html`<button
            class="btn btn-sm p-0"
            @click=${() => {
              deelnemer.mogelijkeOpstapplaatsen.push(opstapplaats);
              this.notifyDataChanged();
            }}
          >
            <rock-icon icon="dashCircle"></rock-icon>
          </button>`}
    </td>`;
  }

  private notifyDataChanged() {
    this.dispatchEvent(
      new CustomEvent('data-changed', {
        bubbles: true,
        composed: true,
      }),
    );
    this.requestUpdate();
  }
}
