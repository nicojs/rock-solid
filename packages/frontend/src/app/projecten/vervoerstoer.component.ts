import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { css, html, nothing, PropertyValues } from 'lit';
import { Aanmelding, Locatie, Project, ProjectType } from '@rock-solid/shared';
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
  opstapplaatsen: Locatie[] = [];

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
        );
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
      this.aanmeldingen
        .map(async (aanmelding) => {
          if (aanmelding.deelnemer) {
            await persoonService.patchPersoon(aanmelding.deelnemer.id, {
              id: aanmelding.deelnemer.id,
              mogelijkeOpstapplaatsen:
                aanmelding.deelnemer.mogelijkeOpstapplaatsen,
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
      <div class="row mb-3 z-index-9999">
        <div class="col">
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
          ></rock-reactive-form-tags>
        </div>
      </div>
      <div class="row mb-3">
        ${this.aanmeldingen.length === 0
          ? html`<p class="alert alert-info">
              Deze projecten hebben nog geen deelnemers met status 'Aangemeld'
              of 'Bevestigd'.
            </p>`
          : this.aanmeldingen.every(
                (aanmelding) =>
                  !aanmelding.deelnemer ||
                  aanmelding.deelnemer?.mogelijkeOpstapplaatsen.length === 0,
              )
            ? html`<p class="alert alert-info">
                Deelnemers in deze projecten hebben nog geen mogelijke
                opstapplaatsen.
              </p>`
            : nothing}
        <table class="table table-hover table-sm table-responsive">
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
            ${this.aanmeldingen.map((aanmelding) => {
              const deelnemer = aanmelding.deelnemer;
              if (!deelnemer) return nothing;
              return html`
                <tr>
                  <th class="fw-normal">${deelnemerLink(deelnemer)}</th>
                  ${this.opstapplaatsen.map((opstapplaats) =>
                    this.renderOpstapplaatsCell(aanmelding, opstapplaats),
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
                        aanmelding.opstapplaats = geselecteerdeLocatie;
                        this.requestUpdate();
                      }}
                    >
                      <option value="">Kies opstapplaats</option>
                      ${deelnemer.mogelijkeOpstapplaatsen.map(
                        (locatie) =>
                          html`<option
                            value="${locatie.id}"
                            ?selected=${aanmelding.opstapplaats?.id ===
                            locatie.id}
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
    `;
  }

  private renderOpstapplaatsCell(
    aanmelding: Aanmelding,
    opstapplaats: Locatie,
  ) {
    const deelnemer = aanmelding.deelnemer!;
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
              if (aanmelding.opstapplaats?.id === opstapplaats.id) {
                aanmelding.opstapplaats = undefined;
              }
              this.requestUpdate();
            }}
          >
            ${opstapplaats.id === aanmelding.opstapplaats?.id
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
