import {
  Project,
  ProjectType,
  UpsertableProject,
  Cursus,
} from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { Query, router } from '../router';
import { capitalize, pluralize } from '../shared';
import { projectService } from './project.service';

@customElement('kei-projecten')
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
            ? html`<kei-projecten-list
                  .projecten="${this.projecten}"
                ></kei-projecten-list>
                <kei-link href="/${pluralize(this.type)}/new" btn btnSuccess
                  ><kei-icon icon="journalPlus" size="md"></kei-icon>
                  ${capitalize(this.type)}</kei-link
                >`
            : html`<kei-loading></kei-loading>`} `;
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
          ? html`<kei-loading></kei-loading>`
          : html`<kei-project-edit
              .project="${project}"
              @project-submitted="${(event: CustomEvent<Project>) =>
                this.addProject(event.detail)}"
            ></kei-project-edit>`;
      default:
        if (this.path[0]?.match(/\d+/)) {
          const [, page, ...rest] = this.path;
          if (this.projectInScope) {
            switch (page) {
              case 'edit':
                return html`<kei-project-edit
                  .project="${this.projectInScope}"
                  @project-submitted="${(event: CustomEvent<Project>) =>
                    this.editProject(event.detail)}"
                ></kei-project-edit>`;
              case 'inschrijvingen':
                return html`<kei-project-inschrijvingen
                  .project="${this.projectInScope}"
                  .path="${rest}"
                ></kei-project-inschrijvingen>`;
              case 'deelnames':
                return html`<kei-project-deelnames
                  .project="${this.projectInScope}"
                  .path="${rest}"
                ></kei-project-deelnames>`;
            }
          } else {
            return html`<kei-loading></kei-loading>`;
          }
        }
        router.navigate(`/${pluralize(this.type)}/list`);
        return html``;
    }
  }
}
