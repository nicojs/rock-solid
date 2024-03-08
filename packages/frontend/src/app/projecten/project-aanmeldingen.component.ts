import {
  Aanmelding,
  Aanmeldingsstatus,
  Deelname,
  Deelnemer,
  FotoToestemming,
  PatchableAanmelding,
  Persoon,
  Project,
  aanmeldingLabels,
  aanmeldingsstatussenWithoutDeelnames,
  calculateAge,
  fotoToestemmingLabels,
  showDatum,
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
  determineFotoToestemmingKind,
  fullName,
  fullNameWithAge,
  iconForGeslacht,
} from '../personen/persoon.pipe';
import {
  TypeAheadHint,
  pluralize,
  UniquenessFailedError,
  show,
  none,
  downloadCsv,
  toAanmeldingenCsv,
  capitalize,
  unknown,
  entities,
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

  public override update(props: PropertyValues<ProjectAanmeldingenComponent>) {
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
    super.update(props);
  }

  private async updateDeelnames(deelnames: Deelname[]) {
    projectService
      .updateDeelnames(this.project.id, parseInt(this.path[1]!), deelnames)
      .then(() => this.navigateToProjecten());
  }

  private async pathBrievenVerzonden(aanmeldingen: Aanmelding[]) {
    projectService
      .patchAanmeldingen(
        this.project.id,
        aanmeldingen.map(
          ({ id, bevestigingsbriefVerzondenOp, vervoersbriefVerzondenOp }) => ({
            id,
            bevestigingsbriefVerzondenOp,
            vervoersbriefVerzondenOp,
          }),
        ),
      )
      .then((aanmeldingen) => {
        this.aanmeldingen$.next(
          this.aanmeldingen!.map(
            (a) => aanmeldingen.find((b) => a.id === b.id) ?? a,
          ),
        );
        this.navigateToAanmeldingen();
      });
  }

  private async pathRekeninguittreksels(aanmeldingen: PatchableAanmelding[]) {
    projectService
      .patchAanmeldingen(this.project.id, aanmeldingen)
      .then((aanmeldingen) => {
        this.aanmeldingen$.next(
          this.aanmeldingen!.map(
            (a) => aanmeldingen.find((b) => a.id === b.id) ?? a,
          ),
        );
        this.navigateToAanmeldingen();
      });
  }

  private async patchStatus(aanmelding: Aanmelding, status: Aanmeldingsstatus) {
    const deelnameCount = aanmelding.deelnames.reduce(
      (acc, d) => acc + (d.effectieveDeelnamePerunage > 0 ? 1 : 0),
      0,
    );
    if (
      aanmeldingsstatussenWithoutDeelnames.includes(status) &&
      deelnameCount > 0
    ) {
      const confirmed = await ModalComponent.instance.confirm(
        html`Weet je zeker dat je de
          aanmelding${aanmelding.deelnemer
            ? html` van <strong>${fullName(aanmelding.deelnemer)}</strong>`
            : nothing}
          wilt
          ${status === 'Geannuleerd'
            ? 'annuleren'
            : 'verplaatsen naar de wachtrij'}?
          Je verwijdert ook
          <strong>${entities(deelnameCount, 'deelname')}</strong>`,
      );
      if (!confirmed) {
        return;
      }
    }
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

  private async patchStatussen(
    aanmeldingen: Aanmelding[],
    status: Aanmeldingsstatus,
  ) {
    projectService
      .patchAanmeldingen(
        this.project.id,
        aanmeldingen.map((aanmelding) => ({ id: aanmelding.id, status })),
      )
      .then((aanmeldingen) => {
        this.aanmeldingen$.next(
          this.aanmeldingen!.map(
            (a) => aanmeldingen.find((b) => a.id === b.id) ?? a,
          ),
        );
      });
  }

  private aanmeldingUpdated = () => {
    projectService
      .updateAanmelding(this.project.id, this.aanmeldingInScope!)
      .then(() => {
        this.navigateToAanmeldingen();
      });
  };

  private async createAanmelding(deelnemer: Deelnemer) {
    try {
      let confirmed = true;
      const missingFields: string[] = [];
      if (!deelnemer.domicilieadres && !deelnemer.verblijfadres) {
        missingFields.push(aanmeldingLabels.plaats);
      }
      if (!deelnemer.geslacht) {
        missingFields.push(aanmeldingLabels.geslacht);
      }
      if (!deelnemer.werksituatie) {
        missingFields.push(aanmeldingLabels.werksituatie);
      }
      if (!deelnemer.woonsituatie) {
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
    const aantalDeelnames = aanmelding.deelnames.filter(
      (deelname) => deelname.effectieveDeelnamePerunage > 0,
    ).length;
    const confirm = await ModalComponent.instance.confirm(
      html`Weet je zeker dat je de
        aanmelding${aanmelding.deelnemer
          ? html` van <strong>${fullName(aanmelding.deelnemer)}</strong>`
          : nothing}
        aan <strong>${printProject(this.project)}</strong> (met
        <strong
          >${aantalDeelnames}
          deelname${aantalDeelnames === 0 ? 's' : ''}</strong
        >) wilt verwijderen?`,
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

  override render() {
    const bevestigdeAanmeldingen = this.aanmeldingen?.filter(
      ({ status }) => status === 'Bevestigd',
    );
    const [page, ...rest] = this.path;
    switch (page) {
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
                event: CustomEvent<PatchableAanmelding[]>,
              ) => this.pathRekeninguittreksels(event.detail)}
              .aanmeldingen=${bevestigdeAanmeldingen}
            ></rock-project-rekeninguittreksels>`
          : html`<rock-loading></rock-loading>`;
      case 'brieven-verzenden':
        return this.aanmeldingen
          ? html`<rock-project-brieven-verzenden
              .project=${this.project}
              @brieven-verzonden=${(event: CustomEvent<Aanmelding[]>) =>
                this.pathBrievenVerzonden(event.detail)}
              .aanmeldingen=${bevestigdeAanmeldingen}
            ></rock-project-brieven-verzenden>`
          : html`<rock-loading></rock-loading>`;
      case 'deelnemerslijst-printen':
        return this.aanmeldingen
          ? html`<rock-deelnemerslijst-printen
              .project=${this.project}
              .aanmeldingen=${bevestigdeAanmeldingen}
            ></rock-deelnemerslijst-printen>`
          : html`<rock-loading></rock-loading>`;
      case 'projectrapport':
        return this.aanmeldingen
          ? html`<rock-projectrapport
              .project=${this.project}
              .aanmeldingen=${bevestigdeAanmeldingen}
            ></rock-projectrapport>`
          : html`<rock-loading></rock-loading>`;
      case 'deelnames':
        const activiteitId = rest[0] ? parseInt(rest[0]) : undefined;
        const activiteit = this.project.activiteiten.find(
          (act) => act.id === activiteitId,
        );
        if (!activiteit) {
          return this.navigateToAanmeldingen();
        }
        return html`<rock-project-deelnames
          .project=${this.project}
          .activiteit=${activiteit}
          .aanmeldingen=${bevestigdeAanmeldingen}
          @deelnames-submitted=${(event: CustomEvent<Deelname[]>) =>
            this.updateDeelnames(event.detail)}
        ></rock-project-deelnames>`;
      case undefined:
        return this.renderProjectAanmeldingen();
      default:
        router.navigate(`/${pluralize(this.project.type)}/aanmeldingen`);
    }
  }

  private navigateToProjecten() {
    router.navigate(`/${pluralize(this.project.type)}`);
  }

  private navigateToAanmeldingen() {
    router.navigate(
      `/${pluralize(this.project.type)}/${this.project.id}/aanmeldingen/`,
    );
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
      ? html` ${this.renderAanmeldingenList(
          wachtlijstAanmeldingen,
          'wachtlijst',
        )}`
      : ''}
    ${geannuleerdeAanmeldingen.length
      ? html` ${this.renderAanmeldingenList(
          geannuleerdeAanmeldingen,
          'annulaties',
        )}`
      : ''}`;
  }

  private renderAanmeldingenList(aanmeldingen: Aanmelding[], heading: string) {
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
          <table class="table table-hover table-sm">
            <thead>
              <tr>
                <th>Naam</th>
                <th class="align-middle">
                  ${aanmeldingLabels.tijdstipVanAanmelden}
                </th>
                <th class="align-middle">Bevestigingsbrief</th>
                <th class="align-middle">Vervoersbrief</th>
                <th class="align-middle">
                  Geboortedatum<br />
                  <small>(leeftijd op startdatum)</small>
                </th>
                <th class="align-middle">Rekeninguittreksel</th>
                <th class="align-middle">Opmerkingen</th>
                <th class="align-middle text-center">Acties</th>
              </tr>
            </thead>
            <tbody>
              ${aanmeldingen.map(
                (aanmelding) =>
                  html` <tr>
                    <td>${this.renderDeelnemerTableData(aanmelding)}</td>
                    <td>${showDatum(aanmelding.tijdstipVanAanmelden)}</td>
                    <td>
                      ${showDatum(aanmelding.bevestigingsbriefVerzondenOp)}
                    </td>
                    <td>${showDatum(aanmelding.vervoersbriefVerzondenOp)}</td>
                    <td>${this.renderGeboortedatumWithAge(aanmelding)}</td>
                    <td>${show(aanmelding.rekeninguittrekselNummer, none)}</td>
                    <td>${show(aanmelding.opmerking, '')}</td>
                    <td class="text-center">
                      <button
                        title="Naar aangemeld"
                        class="btn btn-outline-warning btn-sm me-2"
                        ${privilege('update:aanmeldingen')}
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'Aangemeld')}
                      >
                        <rock-icon icon="arrowUpSquare"></rock-icon>
                      </button>
                      ${this.renderEditButton(aanmelding)}
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>`
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
            btnOutlinePrimary
            href="/${pluralize(this.project.type)}/${this.project
              .id}/aanmeldingen/rekeninguittreksels"
            ><rock-icon icon="cashCoin"></rock-icon> Rekeninguittreksels
            invullen</rock-link
          >
          <rock-link
            btn
            btnOutlinePrimary
            href="/${pluralize(this.project.type)}/${this.project
              .id}/aanmeldingen/brieven-verzenden"
            ><rock-icon icon="mailbox"></rock-icon> Brieven verzenden</rock-link
          >
          <rock-link
            btn
            btnOutlinePrimary
            href="/${pluralize(this.project.type)}/${this.project
              .id}/aanmeldingen/deelnemerslijst-printen"
            ><rock-icon icon="printer"></rock-icon> Deelnemerslijst
            printen</rock-link
          >
          <rock-link
            btn
            btnOutlinePrimary
            href="/${pluralize(this.project.type)}/${this.project
              .id}/aanmeldingen/projectrapport"
            ><rock-icon icon="graphUp"></rock-icon> Projectrapport</rock-link
          >
          <table class="table table-hover table-sm">
            <thead>
              <tr>
                <th
                  class="align-middle text-end text-muted"
                  title="Nr"
                  width="10px"
                >
                  #
                </th>
                <th class="align-middle" title="Status" width="10px"></th>
                <th class="align-middle">Naam</th>
                <th
                  class="text-center align-middle"
                  title="Toestemming foto's"
                  width="100px"
                >
                  📷
                </th>
                <th
                  class="text-center align-middle"
                  title="Geslacht"
                  width="10px"
                >
                  <rock-icon icon="genderNeuter"></rock-icon>
                </th>
                <th
                  class="text-center align-middle"
                  title="Voedingswens"
                  width="10px"
                >
                  🥪
                </th>
                <th class="align-middle">
                  ${aanmeldingLabels.tijdstipVanAanmelden}
                </th>
                <th class="align-middle">Bevestigingsbrief</th>
                <th class="align-middle">Vervoersbrief</th>
                <th class="align-middle">
                  Geboortedatum<br />
                  <small>(leeftijd op startdatum)</small>
                </th>
                <th class="align-middle">Rekeninguittreksel</th>
                <th class="align-middle">Opmerkingen</th>
                <th class="align-middle">
                  ${this.renderActiesButton(aanmeldingen)} Status
                </th>
                <th class="align-middle text-center">Acties</th>
              </tr>
            </thead>
            <tbody>
              ${aanmeldingen.map(
                (aanmelding, i) =>
                  html`<tr>
                    <td class="text-end text-muted">${i + 1}</td>
                    <td>${renderStatusIcon(aanmelding)}</td>
                    <td>${this.renderDeelnemerTableData(aanmelding)}</td>
                    <td class="text-center">
                      ${renderToestemmingFotos(aanmelding)}
                    </td>
                    <td class="text-center">${renderGeslacht(aanmelding)}</td>
                    <td class=" text-center">
                      ${renderVoedingswens(aanmelding.deelnemer)}
                    </td>
                    <td>${showDatum(aanmelding.tijdstipVanAanmelden)}</td>
                    <td>
                      ${showDatum(aanmelding.bevestigingsbriefVerzondenOp)}
                    </td>
                    <td>${showDatum(aanmelding.vervoersbriefVerzondenOp)}</td>
                    <td>${this.renderGeboortedatumWithAge(aanmelding)}</td>
                    <td>${show(aanmelding.rekeninguittrekselNummer, none)}</td>
                    <td>${show(aanmelding.opmerking, '')}</td>
                    <td class="">
                      ${aanmelding.status === 'Aangemeld'
                        ? html`<button
                            title="Bevestigen"
                            ${privilege('update:aanmeldingen')}
                            class="btn btn-outline-success btn-sm"
                            type="button"
                            @click=${() =>
                              this.patchStatus(aanmelding, 'Bevestigd')}
                          >
                            <rock-icon icon="checkCircle"></rock-icon>
                          </button>`
                        : html`<button
                            title="Terug naar aangemeld"
                            ${privilege('update:aanmeldingen')}
                            class="btn btn-success btn-sm"
                            type="button"
                            @click=${() =>
                              this.patchStatus(aanmelding, 'Aangemeld')}
                          >
                            <rock-icon icon="checkCircle"></rock-icon>
                          </button>`}
                      <button
                        title="Naar wachtlijst"
                        ${privilege('update:aanmeldingen')}
                        class="btn btn-outline-warning btn-sm"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'OpWachtlijst')}
                      >
                        <rock-icon icon="hourglass"></rock-icon>
                      </button>
                      <button
                        title="Naar geannuleerd"
                        ${privilege('update:aanmeldingen')}
                        class="btn btn-outline-warning btn-sm"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'Geannuleerd')}
                      >
                        <rock-icon icon="personSlash"></rock-icon>
                      </button>
                    </td>
                    <td class="text-center">
                      ${this.renderEditButton(aanmelding)}
                      ${this.renderDeleteButton(aanmelding)}
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>`
      : nothing}`;
  }

  private renderDeelnemerTableData(aanmelding: Aanmelding) {
    return html` ${renderWarning(aanmelding)}
    ${aanmelding.deelnemer
      ? html`${deelnemerLink(aanmelding.deelnemer)} `
      : deelnemerVerwijderd}
    ${this.renderEersteAanmelding(aanmelding)}`;
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
        title="Aanmelding verwijderen"
        class="btn btn-outline-danger btn-sm ${floatEnd ? 'float-end' : ''}"
        type="button"
        ${privilege('delete:aanmeldingen')}
        @click=${() => this.deleteAanmelding(aanmelding)}
      >
        <rock-icon icon="trash"></rock-icon></button
    ></span>`;
  }
  private renderEditButton(aanmelding: Aanmelding) {
    return html`<rock-link
      btn
      sm
      title="Wijzigen"
      btnOutlinePrimary
      href="/${pluralize(this.project.type)}/${this.project
        .id}/aanmeldingen/edit/${aanmelding.id}"
      ><rock-icon icon="pencil"></rock-icon
    ></rock-link>`;
  }

  private renderActiesButton(aanmeldingen: Aanmelding[]) {
    const toState = aanmeldingen.every(({ status }) => status === 'Bevestigd')
      ? 'Aangemeld'
      : 'Bevestigd';
    return html`<span
      ><button
        title="Alle aanmeldingen ${toState === 'Aangemeld'
          ? 'terug naar aangemeld'
          : 'bevestigen'}"
        class="btn btn-${toState === 'Bevestigd'
          ? 'outline-'
          : ''}success btn-sm"
        type="button"
        ${privilege('update:aanmeldingen')}
        @click=${() => this.patchStatussen(aanmeldingen, toState)}
      >
        <rock-icon icon="checkCircle"></rock-icon></button
    ></span>`;
  }

  private renderGeboortedatumWithAge(aanmelding: Aanmelding) {
    return html`${showDatum(aanmelding.deelnemer?.geboortedatum)}
    ${aanmelding.deelnemer?.geboortedatum
      ? html`(${calculateAge(
          aanmelding.deelnemer.geboortedatum,
          this.project.activiteiten[0]?.van,
        )})`
      : nothing}`;
  }

  private renderCreateAanmeldingForm() {
    return html`<div class="row mb-3 dropdown">
      <div class="col">
        <div class="form-floating flex-grow-1">
          <input
            ${privilege('create:aanmeldingen')}
            type="text"
            class="form-control"
            id="searchPersoonInput"
            placeholder="Persoon aanmelden"
            ${ref(this.searchInput)}
          />
          <label for="searchPersoonInput">Persoon aanmelden</label>
        </div>
      </div>

      <rock-autocomplete
        .searchAction="${(
          volledigeNaamLike: string,
        ): Promise<TypeAheadHint<Deelnemer>[]> =>
          persoonService
            .getAll({
              type: 'deelnemer',
              volledigeNaamLike,
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
        icon="checkCircle"
        class="text-success"
      ></rock-icon>`
    : nothing;
}

function renderToestemmingFotos(aanmelding: Aanmelding): unknown {
  if (aanmelding.deelnemer) {
    const name = fullName(aanmelding.deelnemer);
    const { fotoToestemming } = aanmelding.deelnemer;

    switch (determineFotoToestemmingKind(fotoToestemming)) {
      case 'all':
        return html` <rock-icon
          title="${name} geeft toestemming voor gebruik van foto's voor alle doeleinden"
          icon="camera"
        ></rock-icon>`;
      case 'none':
        return html`<rock-icon
          title="${name} geeft geen toestemming gebruik van foto's"
          icon="cameraVideoOff"
        ></rock-icon>`;
      case 'some':
        return html`${Object.keys(fotoToestemmingLabels).map((key) =>
          renderFotoToestemmingIcon(
            name,
            fotoToestemming,
            key as keyof FotoToestemming,
          ),
        )}`;
    }
  }
  return deelnemerVerwijderd;
}

function renderFotoToestemmingIcon(
  name: string,
  toestemming: FotoToestemming,
  current: keyof FotoToestemming,
) {
  if (!toestemming[current]) {
    return nothing;
  }
  return html`<rock-icon
    class="me-1"
    title="${name} geeft toestemming voor ${fotoToestemmingLabels[current]}"
    icon="${fotoToestemmingIcons[current]}"
  ></rock-icon>`;
}

const fotoToestemmingIcons: Record<keyof FotoToestemming, string> = {
  socialeMedia: 'facebook',
  folder: 'cardChecklist',
  infoboekje: 'journal',
  nieuwsbrief: 'newspaper',
  website: 'globe',
};

function deelnemerLink(deelnemer: Deelnemer) {
  return html`<a
    class="link-body-emphasis"
    href="/deelnemers/display/${deelnemer.id}"
    >${fullName(deelnemer)}</a
  >`;
}

function renderGeslacht(aanmelding: Aanmelding) {
  const title = `Geslacht: ${show(aanmelding.geslacht, unknown)}${
    aanmelding.deelnemer?.geslachtOpmerking
      ? ` (${aanmelding.deelnemer.geslachtOpmerking})`
      : ''
  }`;
  return html`<rock-icon
    title="${title}"
    icon="${iconForGeslacht(aanmelding.geslacht)}"
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
        return nothing;
    }
  }
}
function renderWarning(aanmelding: Aanmelding) {
  const missingFields: string[] = [];
  if (!aanmelding.plaats) {
    missingFields.push(aanmeldingLabels.plaats);
  }
  if (!aanmelding.woonsituatie) {
    missingFields.push(aanmeldingLabels.woonsituatie);
  }
  if (!aanmelding.werksituatie) {
    missingFields.push(aanmeldingLabels.werksituatie);
  }
  if (!aanmelding.geslacht) {
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
