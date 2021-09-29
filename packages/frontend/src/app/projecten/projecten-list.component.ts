import { Project } from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';

@customElement('kei-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public projecten: Project[] | undefined;

  override render() {
    return html`${this.projecten
      ? this.renderProjectenTable()
      : html`<kei-loading></kei-loading>`}`;
  }

  private renderProjectenTable() {
    return html`<h2>Projecten</h2>
      ${JSON.stringify(this.projecten)}`;
  }
}
