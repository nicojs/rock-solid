import {
  Aanmelding,
  Aanmeldingsstatus,
  Deelnemer,
  Persoon,
  Project,
  aanmeldingLabels,
  calculateAge,
  split,
} from '@rock-solid/shared';
import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { firstValueFrom, ReplaySubject, Subscription } from 'rxjs';
import { createRef, ref } from 'lit/directives/ref.js';
import { deelnemerVerwijderd, printProject } from './project.pipes';
import { bootstrap } from '../../styles';
import { projectService } from './project.service';
import { persoonService } from '../personen/persoon.service';
import {
  fullName,
  fullNameWithAge,
  geslachtIcons,
} from '../personen/full-name.pipe';
import {
  TypeAheadHint,
  pluralize,
  showDatum,
  UniquenessFailedError,
  show,
  none,
  downloadCsv,
  toAanmeldingenCsv,
  capitalize,
} from '../shared';
import { router } from '../router';
import { privilege } from '../auth/privilege.directive';
import { ModalComponent } from '../shared/modal.component';

@customElement('rock-project-aanmeldingen')
export class ProjectAanmeldingenComponent extends LitElement {
  static override styles = [bootstrap];

  private aanmeldingen$ = new ReplaySubject<Aanmelding[]>(1);

  @property({ attribute: false })
  public project!: Project;

  @state()
  private aanmeldingen: Aanmelding[] | undefined;

  @property()
  public path!: string[];

  @state()
  private aanmeldingInScope: Aanmelding | undefined;

  private searchInput = createRef<HTMLInputElement>();

  private subscription: Subscription | undefined;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.subscription = this.aanmeldingen$.subscribe((aanmelding) => {
      this.aanmeldingen = aanmelding;
    });
  }

  public override updated(props: PropertyValues<ProjectAanmeldingenComponent>) {
    if (props.has('project')) {
      this.aanmeldingen = undefined;
      projectService.getAanmeldingen(this.project.id).then((aanmeldingen) => {
        this.aanmeldingen$.next(aanmeldingen);
      });
    }
    if (props.has('path') && this.path[0] === 'edit' && this.path[1]) {
      const id = +this.path[1];
      firstValueFrom(this.aanmeldingen$).then((aanmeldingen) => {
        this.aanmeldingInScope = aanmeldingen.find(
          (aanmelding) => aanmelding.id === id,
        );
      });
    }
  }

  private async pathRekeninguittreksels(aanmeldingen: Aanmelding[]) {
    projectService
      .patchAanmeldingen(
        this.project.id,
        aanmeldingen.map(({ id, rekeninguittrekselNummer }) => ({
          id,
          rekeninguittrekselNummer,
        })),
      )
      .then((aanmeldingen) => {
        this.aanmeldingen$.next(
          this.aanmeldingen!.map(
            (a) => aanmeldingen.find((b) => a.id === b.id) ?? a,
          ),
        );
        this.navigateToAanmeldingenList();
      });
  }

  private async patchStatus(aanmelding: Aanmelding, status: Aanmeldingsstatus) {
    projectService
      .patchAanmelding(this.project.id, aanmelding.id, { status })
      .then((aanmelding) => {
        this.aanmeldingen$.next(
          this.aanmeldingen!.map((a) =>
            a.id === aanmelding.id ? aanmelding : a,
          ),
        );
      });
  }

  private aanmeldingUpdated = () => {
    projectService
      .updateAanmelding(this.project.id, this.aanmeldingInScope!)
      .then(() => {
        this.navigateToAanmeldingenList();
      });
  };

  private async createAanmelding(deelnemer: Deelnemer) {
    try {
      let confirmed = true;
      const missingFields: string[] = [];
      if (!deelnemer.domicilieadres && !deelnemer.verblijfadres) {
        missingFields.push(aanmeldingLabels.plaats);
      }
      if (deelnemer.geslacht === 'onbekend') {
        missingFields.push(aanmeldingLabels.geslacht);
      }
      if (deelnemer.werksituatie === 'onbekend') {
        missingFields.push(aanmeldingLabels.werksituatie);
      }
      if (deelnemer.woonsituatie === 'onbekend') {
        missingFields.push(aanmeldingLabels.woonsituatie);
      }
      if (missingFields.length) {
        confirmed = await ModalComponent.instance.confirm(
          html`<p>We missen nog wat informatie van ${fullName(deelnemer)}</p>
            <ul>
              ${missingFields.map(
                (field) =>
                  html`<li>Geen <strong>${field}</strong> bekend.</li>`,
              )}
            </ul>
            <p>
              <rock-link href="/deelnemers/edit/${deelnemer.id}"
                >Deelnemer wijzigen</rock-link
              >
            </p>`,
          `${fullName(deelnemer)} aanmelden?`,
        );
      }
      if (confirmed) {
        const aanmelding = await projectService.createAanmelding(
          this.project.id,
          {
            deelnemerId: deelnemer.id,
            projectId: this.project.id,
          },
        );
        this.aanmeldingen = [...(this.aanmeldingen ?? []), aanmelding];
      }
    } catch (err) {
      if (!(err instanceof UniquenessFailedError)) {
        throw err; // oops 🤷‍♀️
      }
      // Ignore, deelnemer al aangemeld
    }
  }

  private deleteAanmelding = async (aanmelding: Aanmelding) => {
    const confirm = await ModalComponent.instance.confirm(
      html`Weet je zeker dat je de
        aanmelding${aanmelding.deelnemer
          ? html` van <strong>${fullName(aanmelding.deelnemer)}</strong>`
          : nothing}
        aan <strong>${printProject(this.project)}</strong> wilt verwijderen?`,
    );
    if (confirm) {
      await projectService
        .deleteAanmelding(this.project.id, aanmelding)
        .then(() => {
          this.aanmeldingen$.next(
            this.aanmeldingen!.filter((a) => a.id !== aanmelding.id),
          );
        });
      this.aanmeldingen$.next(
        this.aanmeldingen!.filter((a) => a.id !== aanmelding.id),
      );
    }
  };

  private navigateToAanmeldingenList() {
    router.navigate(
      `/${pluralize(this.project.type)}/${this.project.id}/aanmeldingen/`,
    );
  }

  override render() {
    switch (this.path[0]) {
      case 'edit':
        return html`${this.aanmeldingInScope
          ? html`<rock-project-aanmelding-edit
              @aanmelding-updated=${this.aanmeldingUpdated}
              .project=${this.project}
              .aanmelding=${this.aanmeldingInScope}
            ></rock-project-aanmelding-edit>`
          : html`<rock-loading></rock-loading>`}`;
      case 'rekeninguittreksels':
        return this.aanmeldingen
          ? html`<rock-project-rekeninguittreksels
              .project=${this.project}
              @rekeninguittreksels-updated=${(
                event: CustomEvent<Aanmelding[]>,
              ) => this.pathRekeninguittreksels(event.detail)}
              .aanmeldingen=${this.aanmeldingen?.filter(
                ({ status }) => status === 'Bevestigd',
              )}
            ></rock-project-rekeninguittreksels>`
          : html`<rock-loading></rock-loading>`;
      case undefined:
        return this.renderProjectAanmeldingen();
      default:
        router.navigate(`/${pluralize(this.project.type)}/aanmeldingen`);
    }
  }

  private renderProjectAanmeldingen() {
    return html`<h2>Aanmeldingen voor ${printProject(this.project)}</h2>
      ${this.renderCreateAanmeldingForm()}
      ${this.aanmeldingen
        ? this.renderAanmeldingen()
        : html`<rock-loading></rock-loading>`}`;
  }

  private renderAanmeldingen() {
    const [aanmeldingen, wachtlijstOfGeannuleerd] = split(
      this.aanmeldingen!,
      ({ status }) => status === 'Aangemeld' || status === 'Bevestigd',
    );
    const [wachtlijstAanmeldingen, geannuleerdeAanmeldingen] = split(
      wachtlijstOfGeannuleerd,
      ({ status }) => status === 'OpWachtlijst',
    );
    return html` ${this.aanmeldingen?.length
      ? nothing
      : html`<div class="mb-3">Nog geen aanmeldingen 🤷‍♂️</div>`}
    ${this.renderAanmeldingenTable(aanmeldingen)}
    ${wachtlijstAanmeldingen.length
      ? html` ${this.renderAanmeldingenListGroup(
          wachtlijstAanmeldingen,
          'wachtlijst',
        )}`
      : ''}
    ${geannuleerdeAanmeldingen.length
      ? html` ${this.renderAanmeldingenListGroup(
          geannuleerdeAanmeldingen,
          'annulaties',
        )}`
      : ''}`;
  }

  private renderAanmeldingenListGroup(
    aanmeldingen: Aanmelding[],
    heading: string,
  ) {
    return html`${aanmeldingen.length
      ? html`<h4>${capitalize(heading)}</h4>
          <button
            @click=${() =>
              downloadCsv(
                toAanmeldingenCsv(aanmeldingen),
                `${printProject(this.project)}-${heading}`,
              )}
            class="btn btn-outline-secondary"
          >
            <rock-icon icon="download"></rock-icon> Export
          </button>
          <ul class="list-group">
            ${aanmeldingen.map(
              (aanmelding) =>
                html` <li class="list-group-item">
                  ${aanmelding.deelnemer
                    ? deelnemerLink(aanmelding.deelnemer)
                    : deelnemerVerwijderd}
                  ${this.renderDeleteButton(aanmelding, /* floatEnd */ true)}

                  <button
                    title="Naar aangemeld"
                    class="btn btn-outline-primary float-end me-2"
                    ${privilege('write:aanmeldingen')}
                    type="button"
                    @click=${() => this.patchStatus(aanmelding, 'Aangemeld')}
                  >
                    <rock-icon icon="arrowUpSquare"></rock-icon>
                  </button>
                </li>`,
            )}
          </ul>`
      : nothing}`;
  }

  private renderAanmeldingenTable(aanmeldingen: Aanmelding[]) {
    return html`${aanmeldingen?.length
      ? html`<button
            @click=${() =>
              downloadCsv(
                toAanmeldingenCsv(aanmeldingen),
                `${printProject(this.project)}-aanmeldingen`,
              )}
            class="btn btn-outline-secondary"
          >
            <rock-icon icon="download"></rock-icon> Export
          </button>
          <rock-link
            btn
            btnOutlineSecondary
            href="/${pluralize(this.project.type)}/${this.project
              .id}/aanmeldingen/rekeninguittreksels"
            ><rock-icon icon="cashCoin"></rock-icon> Rekeninguittreksels
            invullen</rock-link
          >
          <table class="table table-hover">
            <thead>
              <tr>
                <th title="Bevestigd of aangemeld" width="10px">
                  <rock-icon icon="personLock"></rock-icon>
                </th>
                <th>Naam</th>
                <th
                  class="text-center align-middle"
                  title="Toestemming foto's"
                  width="10px"
                >
                  📷
                </th>
                <th class="text-center" title="Geslacht" width="10px">
                  <rock-icon icon="genderNeuter"></rock-icon>
                </th>
                <th
                  class="text-center align-middle"
                  title="Voedingswens"
                  width="10px"
                >
                  🥪
                </th>
                <th>Ingeschreven op</th>
                <th>
                  Geboortedatum
                  <small>(leeftijd startdatum)</small>
                </th>
                <th>Rekeninguittreksel</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              ${aanmeldingen.map(
                (aanmelding) =>
                  html`<tr>
                    <td>${renderStatusIcon(aanmelding)}</td>
                    <td>
                      ${renderWarning(aanmelding)}
                      ${aanmelding.deelnemer
                        ? html`${deelnemerLink(aanmelding.deelnemer)} `
                        : deelnemerVerwijderd}
                      ${this.renderEersteAanmelding(aanmelding)}
                    </td>
                    <td class="text-center">
                      ${renderToestemmingFotos(aanmelding)}
                    </td>
                    <td class="text-center">${renderGeslacht(aanmelding)}</td>
                    <td class=" text-center">
                      ${renderVoedingswens(aanmelding.deelnemer)}
                    </td>
                    <td>${showDatum(aanmelding.tijdstipVanAanmelden)}</td>
                    <td>
                      ${showDatum(aanmelding.deelnemer?.geboortedatum)}
                      ${aanmelding.deelnemer?.geboortedatum
                        ? html`(${calculateAge(
                            aanmelding.deelnemer.geboortedatum,
                            this.project.activiteiten[0]?.van,
                          )})`
                        : nothing}
                    </td>
                    <td>${show(aanmelding.rekeninguittrekselNummer, none)}</td>
                    <td>
                      <rock-link
                        btn
                        title="Wijzigen"
                        btnOutlinePrimary
                        href="/${pluralize(this.project.type)}/${this.project
                          .id}/aanmeldingen/edit/${aanmelding.id}"
                        ><rock-icon icon="pencil"></rock-icon
                      ></rock-link>
                      ${aanmelding.status === 'Aangemeld'
                        ? html`<button
                            title="Bevestigen"
                            ${privilege('write:aanmeldingen')}
                            class="btn btn-outline-success"
                            type="button"
                            @click=${() =>
                              this.patchStatus(aanmelding, 'Bevestigd')}
                          >
                            <rock-icon icon="lock"></rock-icon>
                          </button>`
                        : html`<button
                            title="Aanmelden"
                            ${privilege('write:aanmeldingen')}
                            class="btn btn-outline-success"
                            type="button"
                            @click=${() =>
                              this.patchStatus(aanmelding, 'Aangemeld')}
                          >
                            <rock-icon icon="unlock"></rock-icon>
                          </button>`}
                      <button
                        title="Naar wachtlijst"
                        ${privilege('write:aanmeldingen')}
                        class="btn btn-outline-warning"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'OpWachtlijst')}
                      >
                        <rock-icon icon="hourglass"></rock-icon>
                      </button>
                      <button
                        title="Annuleren"
                        ${privilege('write:aanmeldingen')}
                        class="btn btn-outline-danger"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'Geannuleerd')}
                      >
                        <rock-icon icon="personSlash"></rock-icon>
                      </button>
                      ${this.renderDeleteButton(aanmelding)}
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>`
      : nothing}`;
  }

  private renderEersteAanmelding(aanmelding: Aanmelding): unknown {
    return [
      aanmelding.deelnemer?.eersteCursus,
      aanmelding.deelnemer?.eersteVakantie,
    ].includes(this.project.projectnummer)
      ? html`
          <span class="badge rounded-pill text-bg-primary"
            >Eerste ${this.project.type}</span
          >
        `
      : nothing;
  }

  private renderDeleteButton(aanmelding: Aanmelding, floatEnd = false) {
    return html`<span
      ><button
        title="Verwijderen"
        class="btn btn-danger ${floatEnd ? 'float-end' : ''}"
        type="button"
        ${privilege('write:aanmeldingen')}
        @click=${() => this.deleteAanmelding(aanmelding)}
      >
        <rock-icon icon="trash"></rock-icon></button
    ></span>`;
  }

  private renderCreateAanmeldingForm() {
    return html`<div class="row mb-3 dropdown">
      <div class="col">
        <div class="form-floating flex-grow-1">
          <input
            ${privilege('write:aanmeldingen')}
            type="text"
            class="form-control"
            id="searchPersoonInput"
            placeholder="Naam persoon"
            ${ref(this.searchInput)}
          />
          <label for="searchPersoonInput">Naam persoon</label>
        </div>
      </div>

      <rock-autocomplete
        .searchAction="${(val: string): Promise<TypeAheadHint<Deelnemer>[]> =>
          persoonService
            .getAll({
              type: 'deelnemer',
              searchType: 'text',
              search: val,
            })
            .then((personen) =>
              (personen as Deelnemer[]).map((persoon) => ({
                text: fullNameWithAge(
                  persoon,
                  this.project.activiteiten[0]?.van,
                ),
                value: persoon,
              })),
            )}"
        @selected="${async (event: CustomEvent<TypeAheadHint<Deelnemer>>) => {
          const deelnemer = event.detail.value;
          await this.createAanmelding(deelnemer);
          this.searchInput.value!.value = '';
          this.searchInput.value!.dispatchEvent(new InputEvent('input'));
        }}"
      ></rock-autocomplete>
    </div>`;
  }
}

function renderStatusIcon(aanmelding: Aanmelding): unknown {
  return aanmelding.status === 'Bevestigd'
    ? html`<rock-icon
        title="${aanmelding.deelnemer
          ? fullName(aanmelding.deelnemer)
          : 'Deelnemer'} is bevestigd"
        icon="lock"
      ></rock-icon>`
    : aanmelding.status === 'Aangemeld'
      ? html`<rock-icon
          title="${aanmelding.deelnemer
            ? fullName(aanmelding.deelnemer)
            : 'Deelnemer'} is aangemeld, maar nog niet bevestigd"
          icon="unlock"
        ></rock-icon>`
      : nothing;
}

function renderToestemmingFotos(aanmelding: Aanmelding): unknown {
  if (aanmelding.deelnemer) {
    return aanmelding.deelnemer?.toestemmingFotos
      ? html` <rock-icon
          title="${fullName(
            aanmelding.deelnemer,
          )} geeft toestemming voor foto's"
          icon="camera"
        ></rock-icon>`
      : html` <rock-icon
          title="${fullName(
            aanmelding.deelnemer,
          )} geeft geen toestemming voor foto's"
          icon="cameraVideoOff"
        ></rock-icon>`;
  }
  return deelnemerVerwijderd;
}

function deelnemerLink(deelnemer: Deelnemer) {
  return html`<a
    class="link-body-emphasis"
    href="/deelnemers/display/${deelnemer.id}"
    >${fullName(deelnemer)}</a
  >`;
}

function renderGeslacht(aanmelding: Aanmelding) {
  if (!aanmelding.geslacht) {
    return nothing;
  }
  const title = `Geslacht: ${aanmelding.geslacht}${
    aanmelding.deelnemer?.geslachtOpmerking
      ? ` (${aanmelding.deelnemer.geslachtOpmerking})`
      : ''
  }`;
  return html`<rock-icon
    title="${title}"
    icon="${geslachtIcons[aanmelding.geslacht]}"
  ></rock-icon>`;
}

function renderVoedingswens({
  voedingswens,
  voedingswensOpmerking,
}: Partial<Pick<Persoon, 'voedingswens' | 'voedingswensOpmerking'>> = {}) {
  const voedingswensTitlePostfix = voedingswensOpmerking
    ? `: ${voedingswensOpmerking}`
    : '';
  if (voedingswens) {
    switch (voedingswens) {
      case 'vegetarisch':
        return html`<rock-icon
          title="Voedingswens Vegetarisch${voedingswensTitlePostfix}"
          icon="customVegetarian"
        ></rock-icon>`;
      case 'halal':
        return html`<rock-icon
          title="Voedingswens Halal${voedingswensTitlePostfix}"
          icon="customHalal"
        ></rock-icon>`;
      case 'anders':
        return html`<rock-icon
          title="Andere voedingswens${voedingswensTitlePostfix}"
          icon="customFood"
        ></rock-icon>`;
      default:
        return html`<rock-icon
          icon="checkCircle"
          title="Geen speciale voedingswens"
        ></rock-icon>`;
    }
  }
}
function renderWarning(aanmelding: Aanmelding) {
  const missingFields: string[] = [];
  if (!aanmelding.plaats) {
    missingFields.push(aanmeldingLabels.plaats);
  }
  if (aanmelding.woonsituatie === 'onbekend') {
    missingFields.push(aanmeldingLabels.woonsituatie);
  }
  if (aanmelding.werksituatie === 'onbekend') {
    missingFields.push(aanmeldingLabels.werksituatie);
  }
  if (aanmelding.geslacht === 'onbekend') {
    missingFields.push(aanmeldingLabels.geslacht);
  }
  if (missingFields.length) {
    return html`<rock-icon
      title="Deze aanmelding mist de volgende velden: ${missingFields.join(
        ', ',
      )}"
      icon="exclamationTriangleFill"
    ></rock-icon>`;
  }
}
