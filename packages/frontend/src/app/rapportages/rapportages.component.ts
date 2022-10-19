import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RockElement } from '../rock-element';

import { bootstrap } from '../../styles';
import { router } from '../router';
import { ProjectReportType } from '@rock-solid/shared';
import { routerLink } from '../shared';

@customElement('rock-rapportages')
export class RapportagesComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
  }

  override render() {
    return html`<div class="row">
        <h2 class="col">Rapportages</h2>
      </div>
      <div class="row">
        <div class="col">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a
                class="nav-link"
                aria-current="page"
                ${routerLink('../inschrijvingen')}
                >Inschrijvingen</a
              >
            </li>
            <li class="nav-item">
              <a class="nav-link" ${routerLink('../deelnames')}>Deelnames</a>
            </li>
          </ul>
        </div>
      </div>
      ${this.renderView()} `;
  }

  private renderView() {
    switch (this.path[0]) {
      case 'inschrijvingen':
      case 'deelnames':
        const reportType: ProjectReportType = this.path[0];
        return html`<rock-project-rapportage
          .reportType=${reportType}
        ></rock-project-rapportage>`;
      default:
        router.navigate(`/rapportages/inschrijvingen`);
    }
  }
}
