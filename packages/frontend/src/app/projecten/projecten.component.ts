import {
  Project,
  ProjectType,
  UpsertableProject,
  Cursus,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { Query, router } from '../router';
import { capitalize, pluralize } from '../shared';
import { projectService } from './project.service';

@customElement('rock-projecten')
export class ProjectenComponent extends LitElement {
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
  private loading = false;

  @state()
  private projectInScope: Project | undefined;

  private loadProjecten() {
    this.projecten = undefined;
    projectService.getAll({ type: this.type }).then((projecten) => {
      this.projecten = projecten;
    });
  }

  override updated(props: PropertyValues<ProjectenComponent>): void {
    if (props.has('path')) {
      if (this.path[0] === 'list') {
        this.loadProjecten();
      }
      const [projectId, page] = this.path;
      if (
        projectId &&
        ['edit', 'inschrijvingen', 'deelnames'].includes(page!)
      ) {
        this.projectInScope = undefined;
        projectService.get(projectId).then((project) => {
          this.projectInScope = project;
        });
      }
    }
  }

  private async addProject(project: Project) {
    this.loading = true;
    await projectService.create(project);
    this.loading = false;
    router.navigate(`/${pluralize(this.type)}/list`);
  }

  private async editProject(project: Project) {
    this.loading = true;
    await projectService.update(project.id, project);
    this.loading = false;
    router.navigate(`/${pluralize(this.type)}/list`);
  }

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`<h2>${capitalize(pluralize(this.type))}</h2>
          ${this.projecten
            ? html`<rock-projecten-list
                  .projecten="${this.projecten}"
                ></rock-projecten-list>
                <rock-link href="/${pluralize(this.type)}/new" btn btnSuccess
                  ><rock-icon icon="journalPlus" size="md"></rock-icon>
                  ${capitalize(this.type)}</rock-link
                >`
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
          if (this.projectInScope) {
            switch (page) {
              case 'edit':
                return html`<rock-project-edit
                  .project="${this.projectInScope}"
                  @project-submitted="${(event: CustomEvent<Project>) =>
                    this.editProject(event.detail)}"
                ></rock-project-edit>`;
              case 'inschrijvingen':
                return html`<rock-project-inschrijvingen
                  .project="${this.projectInScope}"
                  .path="${rest}"
                ></rock-project-inschrijvingen>`;
              case 'deelnames':
                return html`<rock-project-deelnames
                  .project="${this.projectInScope}"
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
