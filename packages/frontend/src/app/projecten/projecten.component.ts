import {
  Project,
  ProjectType,
  UpsertableProject,
  Cursus,
  DeepPartial,
} from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { catchError, of } from 'rxjs';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import { Query, router } from '../router';
import {
  capitalize,
  handleUniquenessError,
  pluralize,
  UniquenessFailedError,
} from '../shared';
import { newActiviteit } from './project-edit.component';
import { projectenStore } from './projecten.store';

@customElement('rock-projecten')
export class ProjectenComponent extends RockElement {
  static override styles = [bootstrap];

  @property()
  public path!: string[];

  @property()
  public query!: Query;

  @property()
  public type: ProjectType = 'cursus';

  @state()
  private projecten: Project[] | undefined;

  @state()
  private totalCount = 0;

  @state()
  private loading = false;

  @state()
  private focussedProject: Project | undefined;

  @state()
  private newProject: DeepPartial<Project> | undefined;

  @state()
  private errorMessage: string | undefined;

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
    this.subscription.add(
      projectenStore.totalCount$.subscribe(
        (count) => (this.totalCount = count),
      ),
    );
  }

  override update(props: PropertyValues<ProjectenComponent>): void {
    if (props.has('type')) {
      projectenStore.setFilter({ type: this.type });
    }
    if (props.has('path')) {
      const [projectId, page] = this.path;
      if (
        projectId &&
        ['edit', 'inschrijvingen', 'deelnames'].includes(page!)
      ) {
        projectenStore.setFocus(projectId);
      }
      if (projectId === 'new') {
        const project: DeepPartial<Project> = {
          naam: '',
          projectnummer: '',
          type: 'cursus',
          activiteiten: [newActiviteit()],
        };
        if (this.type === 'cursus') {
          (project as Cursus).organisatieonderdeel = 'deKei';
        }
        this.newProject = project;
      }
    }
    super.update(props);
  }

  private async addProject(project: Project) {
    this.loading = true;
    projectenStore
      .create(project)
      .pipe(handleUniquenessError((message) => (this.errorMessage = message)))
      .subscribe({
        next: () => {
          this.errorMessage = undefined;
          router.navigate(`/${pluralize(this.type)}/list`);
        },
        complete: () => (this.loading = false),
      });
  }

  private async editProject(project: Project) {
    this.loading = true;
    projectenStore
      .update(project.id, project)
      .pipe(handleUniquenessError((message) => (this.errorMessage = message)))
      .subscribe(() => {
        this.loading = false;
        this.errorMessage = undefined;
        router.navigate(`/${pluralize(this.type)}/list`);
      });
  }

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`<div class="row">
            <h2>${capitalize(pluralize(this.type))} (${this.totalCount})</h2>
          </div>
          ${this.projecten
            ? html`<rock-link href="/${pluralize(this.type)}/new" btn btnSuccess
                  ><rock-icon icon="journalPlus" size="md"></rock-icon>
                  ${capitalize(this.type)}</rock-link
                >
                <rock-projecten-list
                  .projecten="${this.projecten}"
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
                  @project-submitted="${(event: CustomEvent<Project>) =>
                    this.editProject(event.detail)}"
                ></rock-project-edit>`;
              case 'inschrijvingen':
                return html`<rock-project-inschrijvingen
                  .project="${this.focussedProject}"
                  .path="${rest}"
                ></rock-project-inschrijvingen>`;
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
        router.navigate(`/${pluralize(this.type)}/list`);
        return html``;
    }
  }
}
