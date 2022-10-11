import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  GroupField,
  groupingFieldOptions,
  InschrijvingenReport,
  Organisatieonderdeel,
  ReportRow,
  Werksituatie,
  werksituaties,
} from '@rock-solid/shared';
import { RockElement } from '../rock-element';

import { bootstrap } from '../../styles';
import { reportsClient } from './reports-client';
import { show, showOrganisatieonderdeel, showProvincie } from '../shared';
import { selectControl } from '../forms';

@customElement('rock-rapportages')
export class RapportagesComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @state()
  public report?: InschrijvingenReport;

  @state()
  public group1?: GroupField;

  @state()
  public group2?: GroupField;

  override connectedCallback(): void {
    super.connectedCallback();
  }

  public override updated(props: PropertyValues<RapportagesComponent>) {
    if (
      (props.has('group1') || props.has('group2')) &&
      this.group1 &&
      this.group2
    ) {
      reportsClient
        .get(
          'reports/projecten/cursus/inschrijvingen',
          this.group1,
          this.group2,
        )
        .then((report) => (this.report = report));
    }
  }

  override render() {
    return html` <div class="row">
        <h2 class="col">Rapportages</h2>
      </div>
      <div class="row">
        <div class="col">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#"
                >Inschrijvingen</a
              >
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Deelnames</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="row">
        <rock-reactive-form-input-control
          class="col-12 col-md-3 col-sm-5 col-lg-2"
          .control=${groupingControl('group1')}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-3 col-sm-5 col-lg-2"
          .control=${groupingControl('group2')}
          .entity=${this}
        ></rock-reactive-form-input-control>
      </div>

      ${this.report && this.group1 && this.group2
        ? html` <table class="table table-hover table-sm">
            <thead>
              <tr>
                <th>${groupingFieldOptions[this.group1]}</th>
                <th>Totaal</th>
                <th>${groupingFieldOptions[this.group2]}</th>
                <th>Aantal</th>
              </tr>
            </thead>
            <tbody>
              ${this.report.map(
                ({ key, rows, total }) =>
                  html`<tr>
                      <th rowspan="${rows.length}">
                        ${showGroupKey(this.group1!, key)}
                      </th>
                      <td rowspan="${rows.length}">${total}</td>
                      ${renderRowData(this.group2!, rows[0]!)}
                    </tr>
                    ${rows.slice(1).map(
                      (row) =>
                        html`<tr>
                          ${renderRowData(this.group2!, row)}
                        </tr>`,
                    )}`,
              )}
            </tbody>
          </table>`
        : html`<rock-loading></rock-loading>`}`;

    function renderRowData(group: GroupField, { count, key }: ReportRow) {
      return html`<td>${showGroupKey(group, key)}</td>
        <td>${count}</td>`;
    }
  }
}

function groupingControl<TName extends 'group1' | 'group2'>(name: TName) {
  return selectControl<RapportagesComponent, TName>(
    name,
    groupingFieldOptions,
    { placeholder: 'Groepeer op...' },
  );
}

function showGroupKey(group: GroupField, key: string | undefined): string {
  switch (group) {
    case 'jaar':
    case 'woonsituatie':
    case 'geslacht':
      return show(key);
    case 'provincie':
      return showProvincie(
        (typeof key === 'string' && parseInt(key)) || undefined,
      );
    case 'organisatieonderdeel':
      return showOrganisatieonderdeel(key as Organisatieonderdeel | undefined);
    case 'werksituatie':
      return werksituaties[key as Werksituatie];
  }
}
