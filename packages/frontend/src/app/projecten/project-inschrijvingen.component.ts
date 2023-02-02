import { Inschrijving, Project } from '@rock-solid/shared';
import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { firstValueFrom, ReplaySubject, Subscription } from 'rxjs';
import { createRef, ref } from 'lit/directives/ref.js';
import { printProject } from './project.pipes';
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

@customElement('rock-project-inschrijvingen')
export class ProjectInschrijvingenComponent extends LitElement {
  static override styles = [bootstrap];

  private inschrijvingen$ = new ReplaySubject<Inschrijving[]>(1);

  @property({ attribute: false })
  public project!: Project;

  @state()
  private inschrijvingen: Inschrijving[] | undefined;

  @property()
  public path!: string[];

  @state()
  private inschrijvingInScope: Inschrijving | undefined;

  private searchInput = createRef<HTMLInputElement>();

  private subscription: Subscription | undefined;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.subscription = this.inschrijvingen$.subscribe((inschrijvingen) => {
      this.inschrijvingen = inschrijvingen;
    });
  }

  public override updated(
    props: PropertyValues<ProjectInschrijvingenComponent>,
  ) {
    if (props.has('project')) {
      this.inschrijvingen = undefined;
      projectService
        .getInschrijvingen(this.project.id)
        .then((inschrijvingen) => {
          this.inschrijvingen$.next(inschrijvingen);
        });
    }
    if (props.has('path') && this.path[0] === 'edit' && this.path[1]) {
      const id = +this.path[1];
      firstValueFrom(this.inschrijvingen$).then((inschrijvingen) => {
        this.inschrijvingInScope = inschrijvingen.find(
          (inschrijving) => inschrijving.id === id,
        );
      });
    }
  }

  private inschrijvingUpdated = () => {
    projectService
      .updateInschrijving(this.project.id, this.inschrijvingInScope!)
      .then(() => {
        router.navigate(
          `/${pluralize(this.project.type)}/${this.project.id}/inschrijvingen/`,
        );
      });
  };

  override render() {
    switch (this.path[0]) {
      case 'edit':
        return html`${this.inschrijvingInScope
          ? html`<rock-project-inschrijving-edit
              @inschrijving-updated=${this.inschrijvingUpdated}
              .project=${this.project}
              .inschrijving=${this.inschrijvingInScope}
            ></rock-project-inschrijving-edit>`
          : html`<rock-loading></rock-loading>`}`;
      case undefined:
        return this.renderProjectInschrijvingen();
      default:
        router.navigate(`/${pluralize(this.project.type)}/inschrijvingen`);
    }
  }

  private renderProjectInschrijvingen() {
    return html`<h2>Inschrijvingen voor ${printProject(this.project)}</h2>
      ${this.renderCreateInschrijvingForm()}
      ${this.inschrijvingen
        ? this.renderInschrijvingenTable()
        : html`<rock-loading></rock-loading>`}`;
  }

  private renderInschrijvingenTable() {
    return html`${this.inschrijvingen?.length
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
            ${this.inschrijvingen.map(
              (inschrijving) => html`<tr>
                <td>
                  ${fullNameWithAge(
                    inschrijving.deelnemer!,
                    this.project.activiteiten[0]?.van,
                  )}${inschrijving.eersteInschrijving
                    ? html` <span class="badge rounded-pill text-bg-primary"
                        >Eerste cursus</span
                      >`
                    : nothing}
                  ${inschrijving.toestemmingFotos
                    ? html`<rock-icon
                        title="${fullName(
                          inschrijving.deelnemer!,
                        )} geeft toestemming voor fotos"
                        icon="camera"
                      ></rock-icon>`
                    : nothing}
                  ${inschrijving.wachtlijst
                    ? html`<rock-icon
                        title="${fullName(
                          inschrijving.deelnemer!,
                        )} staat op de wachtlijst"
                        icon="hourglass"
                      ></rock-icon>`
                    : nothing}
                </td>
                <td>${showDatum(inschrijving.tijdstipVanInschrijving)}</td>
                <td>${show(inschrijving.rekeninguittrekselNummer, none)}</td>
                <td>
                  <rock-link
                    btn
                    btnOutlinePrimary
                    href="/${pluralize(this.project.type)}/${this.project
                      .id}/inschrijvingen/edit/${inschrijving.id}"
                    ><rock-icon icon="pencil"></rock-icon
                  ></rock-link>
                </td>
              </tr>`,
            )}
          </tbody>
        </table>`
      : html`<div class="mb-3">Nog geen inschrijvingen 🤷‍♂️</div>`}`;
  }

  private renderCreateInschrijvingForm() {
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
            const inschrijving = await projectService.createInschrijving(
              this.project.id,
              {
                deelnemerId: +event.detail.value,
                projectId: this.project.id,
              },
            );
            this.inschrijvingen = [
              ...(this.inschrijvingen ?? []),
              inschrijving,
            ];
          } catch (err) {
            if (!(err instanceof UniquenessFailedError)) {
              throw err; // oops 🤷‍♀️
            }
            // Ignore, deelnemer al ingeschreven
          }
          this.searchInput.value!.value = '';
          this.searchInput.value!.dispatchEvent(new InputEvent('input'));
        }}"
      ></rock-autocomplete>
    </div>`;
  }
}
