import {
  Project,
  ProjectType,
  DeepPartial,
  ProjectFilter,
  Queryfied,
  toProjectFilter,
  tryParseInt,
  organisatieonderdelen,
  allProjectLabels,
  Privilege,
} from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import { router } from '../router';
import {
  capitalize,
  handleUniquenessError,
  pluralize,
  toQuery,
} from '../shared';
import { newActiviteit } from './project-edit.component';
import { projectenStore } from './projecten.store';
import {
  FormControl,
  InputControl,
  InputType,
  checkboxesItemsControl,
} from '../forms';
import { routesByProjectType } from './routing-helper';

@customElement('rock-projecten')
export class ProjectenComponent extends RockElement {
  static override styles = [bootstrap];

  @property()
  public path!: string[];

  @property({ attribute: false })
  public query?: Queryfied<ProjectFilter> & { page: string };

  @property()
  public type: ProjectType = 'cursus';

  @state()
  private projecten: Project[] | undefined;

  @state()
  private loading = false;

  @state()
  private focussedProject: Project | undefined;

  @state()
  private newProject: DeepPartial<Project> | undefined;

  @state()
  private errorMessage: string | undefined;

  @state()
  private filter: ProjectFilter = {
    type: 'cursus',
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      projectenStore.currentPageItem$.subscribe(
        (projecten) => (this.projecten = projecten),
      ),
    );
    this.subscription.add(
      projectenStore.focussedItem$.subscribe(
        (focussedProject) => (this.focussedProject = focussedProject),
      ),
    );
  }

  override update(props: PropertyValues<ProjectenComponent>): void {
    if (props.has('path')) {
      const [projectId, page] = this.path;
      if (projectId && ['edit', 'aanmeldingen', 'deelnames'].includes(page!)) {
        projectenStore.setFocus(projectId);
      }
      if (projectId === 'new') {
        const project: DeepPartial<Project> = {
          naam: '',
          projectnummer: '',
          type: this.type,
          activiteiten: [newActiviteit()],
          begeleiders: [],
        };
        this.newProject = project;
      }
    }
    if (
      (props.has('query') || props.has('path')) &&
      this.query &&
      !this.path.length
    ) {
      const { page, ...filterParams } = this.query;
      this.filter = toProjectFilter(filterParams);
      this.filter.type = this.type;
      const currentPage = (tryParseInt(page) ?? 1) - 1;
      projectenStore.setCurrentPage(currentPage, { ...this.filter });
    }
    super.update(props);
  }

  private async addProject(project: Project) {
    this.loading = true;
    projectenStore
      .create(project)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          allProjectLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = undefined;
          this.navigateToProjectenPage();
        },
        complete: () => (this.loading = false),
      });
  }

  private async editProject(project: Project) {
    this.loading = true;
    projectenStore
      .update(project.id, project)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          allProjectLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = undefined;
          this.navigateToProjectenPage();
        },
        complete: () => (this.loading = false),
      });
  }

  private async deleteProject(event: CustomEvent<Project>) {
    this.loading = true;
    projectenStore.delete(event.detail.id).subscribe({
      next: () => {
        this.errorMessage = undefined;
      },
      complete: () => (this.loading = false),
    });
  }

  private doSearch() {
    const query = toQuery(this.filter);
    delete query['type']; // not needed, already in the path
    router.setQuery(query);
  }

  override render() {
    switch (this.path[0]) {
      case undefined:
        return html`<div class="row">
            <h2 class="col">${capitalize(pluralize(this.type))}</h2>
          </div>
          <div class="row">
            <div class="col">
              <rock-link
                href="/${routesByProjectType[this.type]}/new"
                btn
                btnSuccess
                ><rock-icon icon="journalPlus" size="md"></rock-icon>
                ${capitalize(this.type)}</rock-link
              >
            </div>
          </div>
          <rock-search
            .mainControl=${this.type === 'cursus'
              ? mainCursusSearchControl
              : mainVakantieSearchControl}
            .advancedControls=${this.type === 'cursus'
              ? advancedCursusSearchControls
              : advancedVakantieSearchControls}
            .filter=${this.filter}
            @search-submitted=${() => this.doSearch()}
          ></rock-search>
          ${this.projecten
            ? html`<rock-projecten-list
                  .projecten=${this.projecten}
                  @delete=${this.deleteProject}
                ></rock-projecten-list>
                <rock-paging .store=${projectenStore}></rock-paging>`
            : html`<rock-loading></rock-loading>`} `;
      case 'new':
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-project-edit
              .type=${this.type}
              .project="${this.newProject}"
              .errorMessage=${this.errorMessage}
              privilege="${'create:projecten' satisfies Privilege}"
              @project-submitted="${(event: CustomEvent<Project>) =>
                this.addProject(event.detail)}"
            ></rock-project-edit>`;
      default:
        if (this.path[0]?.match(/\d+/)) {
          const [, page, ...rest] = this.path;
          if (this.focussedProject) {
            switch (page) {
              case 'edit':
                return html`<rock-project-edit
                  .project=${this.focussedProject}
                  .errorMessage=${this.errorMessage}
                  .type=${this.type}
                  privilege="${'update:projecten' satisfies Privilege}"
                  @project-submitted="${(event: CustomEvent<Project>) =>
                    this.editProject(event.detail)}"
                ></rock-project-edit>`;
              case 'aanmeldingen':
                return html`<rock-project-aanmeldingen
                  .project="${this.focussedProject}"
                  .path="${rest}"
                ></rock-project-aanmeldingen>`;
              case 'deelnames':
                return html`<rock-project-deelnames
                  .project="${this.focussedProject}"
                  .path="${rest}"
                ></rock-project-deelnames>`;
            }
          } else {
            return html`<rock-loading></rock-loading>`;
          }
        }
        this.navigateToProjectenPage();
        return html``;
    }
  }

  private navigateToProjectenPage() {
    router.navigate(`/${routesByProjectType[this.type]}`);
  }
}

const mainCursusSearchControl: InputControl<ProjectFilter> = {
  type: InputType.text,
  name: 'titelLike',
  label: 'Titel',
  placeholder: 'Zoek op projectnummer of cursusnaam',
};
const mainVakantieSearchControl: InputControl<ProjectFilter> = {
  type: InputType.text,
  name: 'titelLike',
  label: 'Titel',
  placeholder: 'Zoek op projectnummer of bestemming - land',
};

const advancedVakantieSearchControls: FormControl<ProjectFilter>[] = [
  {
    type: InputType.number,
    name: 'jaar',
    label: 'Jaar',
    placeholder: 'Zoek op jaar',
  },
];

const advancedCursusSearchControls: FormControl<ProjectFilter>[] = [
  {
    type: InputType.number,
    name: 'jaar',
    label: 'Jaar',
    placeholder: 'Zoek op jaar',
  },
  checkboxesItemsControl('organisatieonderdelen', organisatieonderdelen, {
    label: 'Organisatieonderdelen',
  }),
];
