import {
  Project,
  ProjectType,
  UpsertableProject,
  Cursus,
} from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import { Query, router } from '../router';
import { capitalize, pluralize } from '../shared';
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
    super.update(props);
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
    }
  }

  private async addProject(project: Project) {
    this.loading = true;
    projectenStore.create(project).subscribe(() => {
      this.loading = false;
      router.navigate(`/${pluralize(this.type)}/list`);
    });
  }

  private async editProject(project: Project) {
    this.loading = true;
    projectenStore.update(project.id, project).subscribe(() => {
      this.loading = false;
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
        const project: UpsertableProject = {
          naam: '',
          projectnummer: '',
          type: 'cursus',
          activiteiten: [],
        };
        if (this.type === 'cursus') {
          (project as Cursus).organisatieonderdeel = 'deKei';
        }
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-project-edit
              .project="${project}"
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
                  .project="${this.focussedProject}"
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
