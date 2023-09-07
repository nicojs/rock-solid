import {
  Aanmelding,
  Aanmeldingsstatus,
  Deelnemer,
  Persoon,
  Project,
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
                    ? deelnemerLink(
                        aanmelding.deelnemer,
                        this.project.activiteiten[0]?.van,
                      )
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
                <th>
                  Naam (leeftijd op de startdatum van de ${this.project.type})
                </th>
                <th>Ingeschreven op</th>
                <th>Geboortedatum</th>
                <th>Rekeninguittreksel</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              ${aanmeldingen.map(
                (aanmelding) =>
                  html`<tr>
                    <td>
                      ${aanmelding.status === 'Bevestigd'
                        ? html`<rock-icon
                            title="${aanmelding.deelnemer
                              ? fullName(aanmelding.deelnemer)
                              : 'Deelnemer'} is bevestigd"
                            icon="personLock"
                          ></rock-icon>`
                        : nothing}
                      ${aanmelding.status === 'Aangemeld'
                        ? html`<rock-icon
                            title="${aanmelding.deelnemer
                              ? fullName(aanmelding.deelnemer)
                              : 'Deelnemer'} is aangemeld, maar nog niet bevestigd"
                            icon="unlock"
                          ></rock-icon>`
                        : nothing}
                      ${aanmelding.deelnemer?.toestemmingFotos
                        ? html` <rock-icon
                            title="${fullName(
                              aanmelding.deelnemer!,
                            )} geeft toestemming voor foto's"
                            icon="camera"
                          ></rock-icon>`
                        : html` <rock-icon
                            title="${fullName(
                              aanmelding.deelnemer!,
                            )} geeft geen toestemming voor foto's"
                            icon="cameraVideoOff"
                          ></rock-icon>`}
                      ${aanmelding.deelnemer
                        ? html`${deelnemerLink(
                            aanmelding.deelnemer,
                            this.project.activiteiten[0]?.van,
                          )} `
                        : deelnemerVerwijderd}
                      ${renderGeslacht(aanmelding.deelnemer)}
                      ${renderVoedingswens(aanmelding.deelnemer)}
                      ${this.renderEersteAanmelding(aanmelding)}
                    </td>
                    <td>${showDatum(aanmelding.tijdstipVanAanmelden)}</td>
                    <td>${showDatum(aanmelding.deelnemer?.geboortedatum)}</td>
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
                      ${aanmelding.status === 'Aangemeld'
                        ? html`<button
                            title="Bevestigen"
                            ${privilege('write:aanmeldingen')}
                            class="btn btn-outline-success"
                            type="button"
                            @click=${() =>
                              this.patchStatus(aanmelding, 'Bevestigd')}
                          >
                            <rock-icon icon="personLock"></rock-icon>
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
        .searchAction="${(val: string): Promise<TypeAheadHint<Persoon>[]> =>
          persoonService
            .getAll({
              type: 'deelnemer',
              searchType: 'text',
              search: val,
            })
            .then((personen) =>
              personen.map((persoon) => ({
                text: fullNameWithAge(
                  persoon,
                  this.project.activiteiten[0]?.van,
                ),
                value: persoon,
              })),
            )}"
        @selected="${async (event: CustomEvent<TypeAheadHint<Persoon>>) => {
          try {
            const deelnemer = event.detail.value;
            if (!deelnemer.domicilieadres && !deelnemer.verblijfadres) {
              await ModalComponent.instance.alert(
                html`<p>
                  ${fullName(deelnemer)} heeft nog
                  <strong>geen domicilieadres of verblijfadres</strong>.
                  <rock-link href="/deelnemers/edit/${deelnemer.id}"
                    >Vul hier eerst het adres in</rock-link
                  >
                </p>`,
                `Kan ${fullName(deelnemer)} niet aanmelden`,
              );
              return;
            }
            const aanmelding = await projectService.createAanmelding(
              this.project.id,
              {
                deelnemerId: deelnemer.id,
                projectId: this.project.id,
              },
            );
            this.aanmeldingen = [...(this.aanmeldingen ?? []), aanmelding];
          } catch (err) {
            if (!(err instanceof UniquenessFailedError)) {
              throw err; // oops 🤷‍♀️
            }
            // Ignore, deelnemer al aangemeld
          }
          this.searchInput.value!.value = '';
          this.searchInput.value!.dispatchEvent(new InputEvent('input'));
        }}"
      ></rock-autocomplete>
    </div>`;
  }
}

function deelnemerLink(deelnemer: Deelnemer, van: Date | undefined) {
  return html`<a
    class="link-body-emphasis"
    href="/deelnemers/display/${deelnemer.id}"
    >${fullNameWithAge(deelnemer, van)}</a
  >`;
}

function renderGeslacht(
  deelnemer?: Pick<Deelnemer, 'geslacht' | 'geslachtOpmerking'>,
) {
  if (!deelnemer) {
    return nothing;
  }
  const title = `Geslacht: ${deelnemer.geslacht}${
    deelnemer.geslachtOpmerking ? ` (${deelnemer.geslachtOpmerking})` : ''
  }`;
  return html`<rock-icon
    title="${title}"
    icon="${geslachtIcons[deelnemer.geslacht]}"
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
      case 'andere':
        return html`<rock-icon
          title="Andere voedingswens${voedingswensTitlePostfix}"
          icon="customFood"
        ></rock-icon>`;
    }
  }
  return nothing;
}
