import { Project, ProjectType, UpsertableProject } from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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

  @property({ attribute: false })
  private projecten: Project[] | undefined;

  @property()
  public type: ProjectType = 'cursus';

  @property({ attribute: false })
  private loading = false;

  @property({ attribute: false })
  private projectInScope: Project | undefined;

  private loadProjecten() {
    this.projecten = undefined;
    projectService.getAll({ type: this.type }).then((projecten) => {
      this.projecten = projecten;
    });
  }

  override updated(props: PropertyValues<ProjectenComponent>): void {
    if (props.has('path')) {
      if (
        this.path.length >= 2 &&
        ['edit', 'inschrijvingen'].includes(this.path[0]!)
      ) {
        this.projectInScope = undefined;
        projectService.get(this.path[1]!).then((project) => {
          this.projectInScope = project;
        });
      }
      if (this.path[0] === 'list') {
        this.loadProjecten();
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
        return this.loading
          ? html`<kei-loading></kei-loading>`
          : html`<kei-project-edit
              .project="${project}"
              @project-submitted="${(event: CustomEvent<Project>) =>
                this.addProject(event.detail)}"
            ></kei-project-edit>`;
      case 'edit':
        return this.projectInScope
          ? html`<kei-project-edit
              .project="${this.projectInScope}"
              @project-submitted="${(event: CustomEvent<Project>) =>
                this.editProject(event.detail)}"
            ></kei-project-edit>`
          : html`<kei-loading></kei-loading>`;
      case 'inschrijvingen':
        return this.projectInScope
          ? html`<kei-project-inschrijvingen
              .project="${this.projectInScope}"
              .path="${this.path.slice(2)}"
            ></kei-project-inschrijvingen>`
          : html`<kei-loading></kei-loading>`;
      default:
        router.navigate(`/${pluralize(this.type)}/list`);
        return html``;
    }
  }
}
