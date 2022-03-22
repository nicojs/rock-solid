import { Inschrijving, Project } from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { projectService } from './project.service';
import { persoonService } from '../personen/persoon.service';
import { fullName } from '../personen/full-name.pipe';
import {
  TypeAheadHint,
  AutocompleteComponent,
  pluralize,
  showBoolean,
  showDatum,
} from '../shared';
import { router } from '../router';
import { firstValueFrom, ReplaySubject, Subscription } from 'rxjs';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('kei-project-inschrijvingen')
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
          ? html`<kei-project-inschrijving-edit
              @inschrijving-updated=${this.inschrijvingUpdated}
              .project=${this.project}
              .inschrijving=${this.inschrijvingInScope}
            ></kei-project-inschrijving-edit>`
          : html`<kei-loading></kei-loading>`}`;
      case undefined:
        return this.renderProjectInschrijvingen();
      default:
        router.navigate(`/${pluralize(this.project.type)}/inschrijvingen`);
    }
  }

  private renderProjectInschrijvingen() {
    return html`<h2>
        Inschrijvingen voor ${this.project.id} ${this.project.naam}
      </h2>
      ${this.renderCreateInschrijvingForm()}
      ${this.inschrijvingen
        ? this.renderInschrijvingenTable()
        : html`<kei-loading></kei-loading>`}`;
  }

  private renderInschrijvingenTable() {
    return html`${this.inschrijvingen?.length
      ? html`<table class="table table-hover">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Ingeschreven op</th>
              <th>Wachtlijst?</th>
              <th>Toestemming voor fotos?</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            ${this.inschrijvingen.map(
              (inschrijving) => html`<tr>
                <td>${fullName(inschrijving.deelnemer!)}</td>
                <td>${showDatum(inschrijving.tijdstipVanInschrijving)}</td>
                <td>${showBoolean(inschrijving.wachtlijst)}</td>
                <td>${showBoolean(inschrijving.toestemmingFotos)}</td>
                <td>
                  <kei-link
                    btn
                    btnOutlinePrimary
                    href="/${pluralize(this.project.type)}/${this.project
                      .id}/inschrijvingen/edit/${inschrijving.id}"
                    ><kei-icon icon="pencil"></kei-icon
                  ></kei-link>
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
            type="email"
            class="form-control"
            id="searchPersoonInput"
            placeholder="Persoon inschrijven"
            ${ref(this.searchInput)}
          />
          <label for="searchPersoonInput">Persoon inschrijven</label>
        </div>
      </div>

      <kei-autocomplete
        .searchAction="${(val: string): Promise<TypeAheadHint[]> =>
          persoonService
            .getAll({
              type: 'deelnemer',
              searchType: 'text',
              search: val,
            })
            .then((personen) =>
              personen.map((persoon) => ({
                text: fullName(persoon),
                value: persoon.id,
              })),
            )}"
        @selected="${async (event: CustomEvent<TypeAheadHint>) => {
          const inschrijving = await projectService.createInschrijving(
            this.project.id,
            {
              deelnemerId: +event.detail.value,
              projectId: this.project.id,
            },
          );
          this.inschrijvingen = [...(this.inschrijvingen ?? []), inschrijving];
          this.searchInput.value!.value = '';
          this.searchInput.value!.dispatchEvent(new InputEvent('input'));
        }}"
      ></kei-autocomplete>
    </div>`;
  }
}
