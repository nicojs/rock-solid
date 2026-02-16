import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { css, html, nothing, PropertyValues } from 'lit';
import {
  Aanmelding,
  Deelnemer,
  Locatie,
  notEmpty,
  Project,
  ProjectType,
} from '@rock-solid/shared';
import { projectService } from './project.service';
import { deelnemerLink, printProject } from './project.pipes';
import { fullName } from '../personen/persoon.pipe';
import { bootstrap } from '../../styles';
import { showLocatie } from '../locaties/locatie.pipe';
import { tagsControl } from '../forms';
import { locatieService } from '../locaties/locatie.service';
import { formStyles } from '../forms/reactive-form.component';
import { persoonService } from '../personen/persoon.service';

const ACTIVE_STATUSSEN = Object.freeze(['Bevestigd', 'Aangemeld']);

@customElement('rock-vervoerstoer')
export class VervoerstoerComponent extends RockElement {
  static override styles = [
    bootstrap,
    formStyles,

    css`
      .text-vertical {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        text-align: center;
        vertical-align: middle;
      }
      .z-index-900 {
        z-index: 900;
      }
      table {
        table-layout: fixed;
      }
    `,
  ];

  @property({ attribute: false })
  public projectIds: number[] = [];

  @property({ type: Boolean })
  public enkelVakanties = false;

  @property()
  public type: ProjectType = 'cursus';

  @state()
  public projecten?: Project[];

  @state()
  public aanmeldingen?: Aanmelding[];

  @state()
  private deelnemers: Deelnemer[] = [];

  @state()
  opstapplaatsen: Locatie[] = [];

  aanmeldingenPerDeelnemerId: Map<number, Aanmelding[]> = new Map();

  protected override update(
    changedProperties: PropertyValues<VervoerstoerComponent>,
  ): void {
    if (
      changedProperties.has('projectIds') ||
      changedProperties.has('enkelVakanties')
    ) {
      this.#loadProjecten();
    }
    if (changedProperties.has('aanmeldingen') && this.aanmeldingen) {
      this.opstapplaatsen = this.aanmeldingen
        .flatMap(
          (aanmelding) => aanmelding.deelnemer?.mogelijkeOpstapplaatsen || [],
        )
        .filter(
          (value, index, self) =>
            self.findIndex((val) => val.id === value.id) === index,
        )
        .filter(
          (opstapplaats) =>
            opstapplaats.geschiktVoorVakantie || !this.enkelVakanties,
        )
        .sort((a, b) => a.naam.localeCompare(b.naam));
      this.deelnemers = this.aanmeldingen
        .map((aanmelding) => aanmelding.deelnemer)
        .filter(notEmpty)
        .filter(
          (value, index, self) =>
            value && self.findIndex((val) => val.id === value.id) === index,
        );
      this.aanmeldingenPerDeelnemerId = new Map();
      for (const aanmelding of this.aanmeldingen) {
        if (aanmelding.deelnemerId) {
          const lijst =
            this.aanmeldingenPerDeelnemerId.get(aanmelding.deelnemerId) || [];
          lijst.push(aanmelding);
          this.aanmeldingenPerDeelnemerId.set(aanmelding.deelnemerId, lijst);
        }
      }
    }
    super.update(changedProperties);
  }

  async #loadProjecten() {
    this.projecten = undefined;
    this.aanmeldingen = undefined;
    [this.projecten, this.aanmeldingen] = await Promise.all([
      projectService.getAll({
        ids: this.projectIds,
        type: this.type,
      }),
      Promise.all(
        this.projectIds.map((id) => projectService.getAanmeldingen(id)),
      ).then((aanmeldingen) =>
        aanmeldingen
          .flat()
          .filter((aanmelding) => ACTIVE_STATUSSEN.includes(aanmelding.status)),
      ),
    ]);
  }

  @state()
  private isLoading = false;

  async save() {
    if (!this.aanmeldingen) return;
    this.isLoading = true;
    await Promise.all(
      this.deelnemers
        .map(async (deelnemer) => {
          if (deelnemer) {
            await persoonService.patchPersoon(deelnemer.id, {
              id: deelnemer.id,
              mogelijkeOpstapplaatsen: deelnemer.mogelijkeOpstapplaatsen,
            });
          }
        })
        .concat(
          ...this.projectIds.map(async (projectId) => {
            await projectService.patchAanmeldingen(
              projectId,
              this.aanmeldingen!.filter(
                (aanmelding) => aanmelding.projectId === projectId,
              ).map(({ id, opstapplaats }) => ({
                id,
                opstapplaats: opstapplaats ?? null,
              })),
            );
          }),
        ),
    );
    this.isLoading = false;
  }

  override render() {
    if (!this.projecten || !this.aanmeldingen) {
      return html`<rock-loading></rock-loading>`;
    }
    return html`
      <h2>Vervoerstoer maken</h2>
      <p>
        Projecten geselecteerd:
        ${this.projecten.map(
          (project) =>
            html`<span class="ms-2 badge text-bg-secondary"
              >${printProject(project)}</span
            >`,
        )}
      </p>
      <details class="alert alert-info">
        <summary>Uitleg</summary>
        <p>
          Hieronder kun je mogelijke opstapplaatsen van de deelnemers beheren en
          een opstapplaats toewijzen per deelnemer.
        </p>
        <ol>
          <li>
            Gebruik het veld 'Opstapplaatsen' om beschikbare opstapplaatsen toe
            te voegen aan de vervoerstoer. Maak nieuwe opstapplaatsen aan via
            <a href="/locaties">Locaties beheren</a>
          </li>
          <li>
            Voor elke deelnemer in de tabel kun je de opstapplaatsen beheren door op de icoontjes te klikken.
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
            Gebruik de dropdown in de laatste kolom om een opstapplaats te
            kiezen voor deze vervoerstoer.
          </li>
          <li>Klik op 'Opslaan' om je wijzigingen te bewaren.</li>
        </ol>
      </details>
      <div class="row mb-3 z-index-9999">
        <div class="col mb-3">
          <rock-reactive-form-tags
            .entity=${this}
            .control=${tagsControl<VervoerstoerComponent, 'opstapplaatsen'>(
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

          <div class="col-12 table-responsive">
            <table class="table table-hover table-sm">
              <thead class="sticky-top z-index-900">
                <tr>
                  <th style="width: 200px">Deelnemer</th>
                  ${this.opstapplaatsen?.map(
                    (opstapplaats) =>
                      html`<th style="width: 40px" class="text-vertical">
                        ${opstapplaats.naam}
                      </th>`,
                  )}
                  <th>Gekozen opstapplaats</th>
                </tr>
              </thead>
              <tbody>
                ${this.deelnemers.map((deelnemer) => {
                  if (!deelnemer) return nothing;
                  return html`
                    <tr>
                      <th class="fw-normal">${deelnemerLink(deelnemer)}</th>
                      ${this.opstapplaatsen.map((opstapplaats) =>
                        this.renderOpstapplaatsCell(deelnemer, opstapplaats),
                      )}
                      <td>
                        <select
                          class="form-select form-select-sm"
                          @change=${(ev: Event) => {
                            const select = ev.target as HTMLSelectElement;
                            const selectedId = Number(select.value);
                            const geselecteerdeLocatie =
                              deelnemer.mogelijkeOpstapplaatsen.find(
                                (loc) => loc.id === selectedId,
                              );
                            const aanmeldingen =
                              this.aanmeldingenPerDeelnemerId.get(
                                deelnemer.id,
                              ) || [];
                            for (const aanmelding of aanmeldingen) {
                              aanmelding.opstapplaats = geselecteerdeLocatie;
                            }
                            this.requestUpdate();
                          }}
                        >
                          <option value="">Kies opstapplaats</option>
                          ${deelnemer.mogelijkeOpstapplaatsen.map(
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
                        </select>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
          <div class="col">
            <button
              class="btn btn-primary"
              @click=${() => this.save()}
              ?disabled=${this.isLoading}
            >
              ${this.isLoading
                ? html`<span
                      class="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    <span role="status">Opslaan...</span>`
                : html`<rock-icon icon="floppy"></rock-icon> Opslaan`}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderOpstapplaatsCell(deelnemer: Deelnemer, opstapplaats: Locatie) {
    const naam = fullName(deelnemer);
    const isOpstapplaats =
      deelnemer.mogelijkeOpstapplaatsen.find(
        (value) => value.id === opstapplaats.id,
      ) !== undefined;
    return html`<td
      title="${isOpstapplaats
        ? `${naam} heeft ${showLocatie(opstapplaats)} als mogelijke opstapplaats`
        : `Click om ${showLocatie(opstapplaats)} als mogelijke opstapplaats toe te voegen voor ${naam}`}"
      class="text-center"
    >
      ${isOpstapplaats
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
              this.requestUpdate();
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
              this.requestUpdate();
            }}
          >
            <rock-icon icon="dashCircle"></rock-icon>
          </button>`}
    </td>`;
  }
}
