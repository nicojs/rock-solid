import {
  Aanmelding,
  Aanmeldingsstatus,
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
import { fullName, fullNameWithAge } from '../personen/full-name.pipe';
import {
  TypeAheadHint,
  pluralize,
  showDatum,
  UniquenessFailedError,
  show,
  none,
} from '../shared';
import { router } from '../router';

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
        router.navigate(
          `/${pluralize(this.project.type)}/${this.project.id}/aanmeldingen/`,
        );
      });
  };

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
      ? html`<h4>Wachtlijst</h4>
          ${this.renderAanmeldingenListGroup(wachtlijstAanmeldingen)}`
      : ''}
    ${geannuleerdeAanmeldingen.length
      ? html`<h4>Annulaties</h4>
          ${this.renderAanmeldingenListGroup(geannuleerdeAanmeldingen)}`
      : ''}`;
  }

  private renderAanmeldingenListGroup(aanmeldingen: Aanmelding[]) {
    return html`${aanmeldingen.length
      ? html`<ul class="list-group">
          ${aanmeldingen.map(
            (aanmelding) => html` <li class="list-group-item">
              ${aanmelding.deelnemer
                ? fullNameWithAge(
                    aanmelding.deelnemer,
                    this.project.activiteiten[0]?.van,
                  )
                : deelnemerVerwijderd}
              <button
                title="Naar aangemeld"
                class="btn btn-outline-primary float-end"
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
      ? html`<table class="table table-hover">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Ingeschreven op</th>
              <th>Rekeninguittreksel</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            ${aanmeldingen.map(
              (aanmelding) => html`<tr>
                <td>
                  ${aanmelding.status === 'Bevestigd'
                    ? html`<rock-icon
                        title="${aanmelding.deelnemer
                          ? fullName(aanmelding.deelnemer)
                          : 'Deelnemer'} is bevestigd"
                        icon="personLock"
                      ></rock-icon>`
                    : nothing}
                  ${aanmelding.deelnemer
                    ? fullNameWithAge(
                        aanmelding.deelnemer,
                        this.project.activiteiten[0]?.van,
                      )
                    : deelnemerVerwijderd}${aanmelding.eersteAanmelding
                    ? html` <span class="badge rounded-pill text-bg-primary"
                        >Eerste cursus</span
                      >`
                    : nothing}
                  ${aanmelding.toestemmingFotos
                    ? html`<rock-icon
                        title="${fullName(
                          aanmelding.deelnemer!,
                        )} geeft toestemming voor fotos"
                        icon="camera"
                      ></rock-icon>`
                    : nothing}
                </td>
                <td>${showDatum(aanmelding.tijdstipVanAanmelden)}</td>
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
                    class="btn btn-outline-warning"
                    type="button"
                    @click=${() => this.patchStatus(aanmelding, 'OpWachtlijst')}
                  >
                    <rock-icon icon="hourglass"></rock-icon>
                  </button>
                  ${aanmelding.status === 'Aangemeld'
                    ? html`<button
                        title="Bevestigen"
                        class="btn btn-outline-success"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'Bevestigd')}
                      >
                        <rock-icon icon="personLock"></rock-icon>
                      </button>`
                    : html`<button
                        title="Onbevestigen"
                        class="btn btn-outline-success"
                        type="button"
                        @click=${() =>
                          this.patchStatus(aanmelding, 'Aangemeld')}
                      >
                        <rock-icon icon="unlock"></rock-icon>
                      </button>`}
                  <button
                    title="Annuleren"
                    class="btn btn-outline-danger"
                    type="button"
                    @click=${() => this.patchStatus(aanmelding, 'Geannuleerd')}
                  >
                    <rock-icon icon="personSlash"></rock-icon>
                  </button>
                </td>
              </tr>`,
            )}
          </tbody>
        </table>`
      : nothing}`;
  }

  private renderCreateAanmeldingForm() {
    return html`<div class="row mb-3 dropdown">
      <div class="col">
        <div class="form-floating flex-grow-1">
          <input
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
        .searchAction="${(val: string): Promise<TypeAheadHint[]> =>
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
                value: persoon.id,
              })),
            )}"
        @selected="${async (event: CustomEvent<TypeAheadHint>) => {
          try {
            const aanmelding = await projectService.createAanmelding(
              this.project.id,
              {
                deelnemerId: +event.detail.value,
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
