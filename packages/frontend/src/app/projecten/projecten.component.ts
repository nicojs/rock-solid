import { Project } from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Query, router } from '../router';
import { projectService } from './project.service';

@customElement('kei-projecten')
export class ProjectenComponent extends LitElement {
  @property()
  public path!: string[];

  @property()
  public query!: Query;

  @property({ attribute: false })
  private projecten: Project[] | undefined;

  override connectedCallback() {
    super.connectedCallback();
    projectService.getAll().then((projecten) => {
      this.projecten = projecten;
    });
  }

  override updated(props: PropertyValues<ProjectenComponent>): void {
    console.log(props);
  }

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`<kei-projecten-list
          .projecten="${this.projecten}"
        ></kei-projecten-list>`;
      default:
        console.log('nav');
        router.navigate('/projecten/list');
        return html``;
    }
  }
}
