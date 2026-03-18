import {
  Aanmelding,
  Activiteit,
  Deelnemer,
  Locatie,
  notEmpty,
  Vervoerstoer,
  VervoerstoerStop,
} from '@rock-solid/shared';
import { css, html, nothing, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tagsControl } from '../forms';
import { formStyles } from '../forms/reactive-form.component';
import { showLocatie } from '../locaties/locatie.pipe';
import { locatieService } from '../locaties/locatie.service';
import { fullName } from '../personen/persoon.pipe';
import { RockElement } from '../rock-element';
import { deelnemerLink } from '../projecten/project.pipes';
import { bootstrap } from '../../styles';

const pad = (n: number) => String(n).padStart(2, '0');
function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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
  activiteiten: Activiteit[] = [];

  @property({ attribute: false })
  aanmeldingenPerDeelnemerId: Map<number, Aanmelding[]> = new Map();

  @property({ type: Boolean })
  isLoading = false;

  @property({ type: Boolean })
  enkelVakanties = false;

  @property({ type: Boolean })
  step2Enabled = false;

  private get bestemmingStop(): VervoerstoerStop | undefined {
    return this.vervoerstoer.bestemmingStop;
  }

  private get allStops(): VervoerstoerStop[] {
    return [
      ...this.vervoerstoer.toeTeKennenStops,
      ...this.vervoerstoer.routes.flatMap((r) => r.stops),
      ...(this.vervoerstoer.bestemmingStop
        ? [this.vervoerstoer.bestemmingStop]
        : []),
    ];
  }

  private findStop(locatieId: number): VervoerstoerStop | undefined {
    return this.allStops.find((s) => s.locatie.id === locatieId);
  }

  private gekozenLocatieId(deelnemer: Deelnemer): number | undefined {
    const aanmeldingIds = new Set(
      (this.aanmeldingenPerDeelnemerId.get(deelnemer.id) ?? []).map(
        (a) => a.id,
      ),
    );
    const stop = this.allStops.find((s) =>
      s.aanmeldersOpTePikken.some((a) => aanmeldingIds.has(a.id)),
    );
    return stop?.locatie.id;
  }

  private assignDeelnemerToLocatie(
    deelnemer: Deelnemer,
    locatie: Locatie | undefined,
  ) {
    const aanmeldingen =
      this.aanmeldingenPerDeelnemerId.get(deelnemer.id) ?? [];

    // Remove from all current stops (incl. bestemming)
    for (const stop of this.allStops) {
      stop.aanmeldersOpTePikken = stop.aanmeldersOpTePikken.filter(
        (a) => !aanmeldingen.some((aa) => aa.id === a.id),
      );
    }

    if (locatie) {
      const isBestemming =
        locatie.id === this.vervoerstoer.bestemmingStop?.locatie.id;
      if (isBestemming) {
        this.vervoerstoer.bestemmingStop!.aanmeldersOpTePikken.push(
          ...aanmeldingen,
        );
      } else {
        let stop = this.vervoerstoer.toeTeKennenStops.find(
          (s) => s.locatie.id === locatie.id,
        );
        if (!stop) {
          stop = {
            id: 0,
            locatie,
            volgnummer: 0,
            aanmeldersOpTePikken: [],
          };
          this.vervoerstoer.toeTeKennenStops.push(stop);
        }
        stop.aanmeldersOpTePikken.push(...aanmeldingen);
      }
    }

    this.notifyDataChanged();
  }

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
                  ${this.bestemmingStop
                    ? html`<th
                        title="Rechtstreeks naar ${this.bestemmingStop.locatie
                          .naam}"
                        style="width: 40px"
                        class="text-vertical bg-dark-subtle"
                      >
                        <span class="text-vertical-label"
                          >${this.bestemmingStop.locatie.naam}</span
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
                  const gekozenId = this.gekozenLocatieId(deelnemer);
                  return html`
                    <tr>
                      <th class="fw-normal sticky-first-column">
                        ${deelnemerLink(deelnemer)}
                      </th>
                      ${this.opstapplaatsen.map((opstapplaats) =>
                        this.renderOpstapplaatsCell(
                          deelnemer,
                          opstapplaats,
                          gekozenId,
                        ),
                      )}
                      ${this.bestemmingStop
                        ? this.renderOpstapplaatsCell(
                            deelnemer,
                            this.bestemmingStop.locatie,
                            gekozenId,
                            true,
                          )
                        : nothing}
                      <td>
                        <select
                          class="form-select form-select-sm"
                          @change=${(ev: Event) => {
                            const select = ev.target as HTMLSelectElement;
                            const selectedId = Number(select.value);
                            const allLocaties = [
                              ...deelnemer.mogelijkeOpstapplaatsen.filter(
                                (l) => l.soort !== 'cursushuis',
                              ),
                              ...(this.bestemmingStop
                                ? [this.bestemmingStop.locatie]
                                : []),
                            ];
                            const locatie = allLocaties.find(
                              (l) => l.id === selectedId,
                            );
                            this.assignDeelnemerToLocatie(deelnemer, locatie);
                          }}
                        >
                          <option value="">Kies opstapplaats</option>
                          ${deelnemer.mogelijkeOpstapplaatsen
                            .filter((locatie) => locatie.soort !== 'cursushuis')
                            .map(
                              (locatie) =>
                                html`<option
                                  value="${locatie.id}"
                                  ?selected=${gekozenId === locatie.id}
                                >
                                  ${showLocatie(locatie)}
                                </option>`,
                            )}
                          ${this.bestemmingStop &&
                          deelnemer.mogelijkeOpstapplaatsen.some(
                            (loc) =>
                              loc.id === this.bestemmingStop!.locatie.id,
                          )
                            ? html`<option
                                value="${this.bestemmingStop.locatie.id}"
                                ?selected=${gekozenId ===
                                this.bestemmingStop.locatie.id}
                              >
                                👉 Rechtstreeks naar
                                ${showLocatie(this.bestemmingStop.locatie)}
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

  #selectedActiviteitId(): number | undefined {
    const bestemming = this.bestemmingStop?.locatie;
    const datum = this.vervoerstoer.datum;
    if (!bestemming || !datum) return undefined;
    return this.#activiteitenMetLocatie().find(
      (a) =>
        a.locatie?.id === bestemming.id &&
        a.van.getTime() === datum.getTime(),
    )?.id;
  }

  #activiteitenMetLocatie() {
    return this.activiteiten.filter(
      (a) => a.locatie,
    );
  }

  #renderBestemmingInput() {
    const selectedId = this.#selectedActiviteitId();
    const datumVal = this.vervoerstoer.datum
      ? toDateValue(this.vervoerstoer.datum)
      : '';
    const datumTerugVal = this.vervoerstoer.datumTerug
      ? toDateValue(this.vervoerstoer.datumTerug)
      : '';
    return html`<div class="col-auto">
        <label class="form-label fw-bold">Activiteit</label>
        <select
          class="form-select"
          @change=${(ev: Event) => {
            const select = ev.target as HTMLSelectElement;
            const activiteitId = Number(select.value);
            const activiteit = this.activiteiten.find(
              (a) => a.id === activiteitId,
            );
            if (activiteit) {
              const locatie = activiteit.locatie;
              this.vervoerstoer.bestemmingStop = locatie
                ? {
                    id: 0,
                    locatie,
                    volgnummer: 0,
                    aanmeldersOpTePikken: [],
                  }
                : undefined;
              this.vervoerstoer.datum = activiteit.van;
              this.vervoerstoer.datumTerug = activiteit.totEnMet;
            } else {
              this.vervoerstoer.bestemmingStop = undefined;
              this.vervoerstoer.datum = undefined;
              this.vervoerstoer.datumTerug = undefined;
            }
            this.notifyDataChanged();
          }}
        >
          <option value="">Kies activiteit</option>
          ${this.#activiteitenMetLocatie().map(
            (activiteit) => {
              const locatie = activiteit.locatie!;
              return html`<option
                value="${activiteit.id}"
                ?selected=${selectedId === activiteit.id}
              >
                ${showLocatie(locatie)} (${toDateValue(activiteit.van)} – ${toDateValue(activiteit.totEnMet)})
              </option>`;
            },
          )}
        </select>
      </div>
      <div class="col-auto">
        <label class="form-label fw-bold">Datum heen</label>
        <input
          type="date"
          class="form-control"
          .value=${datumVal}
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            this.vervoerstoer.datum = v ? new Date(v) : undefined;
            this.notifyDataChanged();
          }}
        />
      </div>
      <div class="col-auto">
        <label class="form-label fw-bold">Datum terug</label>
        <input
          type="date"
          class="form-control"
          .value=${datumTerugVal}
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            this.vervoerstoer.datumTerug = v ? new Date(v) : undefined;
            this.notifyDataChanged();
          }}
        />
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

  private renderOpstapplaatsCell(
    deelnemer: Deelnemer,
    opstapplaats: Locatie,
    gekozenId: number | undefined,
    isBestemming = false,
  ) {
    const naam = fullName(deelnemer);
    const isMogelijkeOpstapplaats = deelnemer.mogelijkeOpstapplaatsen.some(
      (value) => value.id === opstapplaats.id,
    );
    const isGekozen = gekozenId === opstapplaats.id;
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
              if (isGekozen) {
                this.assignDeelnemerToLocatie(deelnemer, undefined);
              }
              this.notifyDataChanged();
            }}
          >
            ${isGekozen
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
