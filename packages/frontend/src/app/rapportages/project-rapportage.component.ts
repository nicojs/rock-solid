import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  GroupField,
  groupingFieldOptions,
  ProjectReport,
  Organisatieonderdeel,
  ProjectType,
  projectTypes,
  ReportRow,
  Werksituatie,
  werksituaties,
  ProjectReportType,
} from '@rock-solid/shared';
import { reportsClient } from './reports-client';
import { html, PropertyValues } from 'lit';
import { selectControl } from '../forms';
import { show, showOrganisatieonderdeel, showProvincie } from '../shared';

@customElement('rock-project-rapportage')
export class ProjectRapportageComponent extends RockElement {
  static override styles = [bootstrap];

  @property()
  public reportType!: ProjectReportType;

  @state()
  public report?: ProjectReport;

  @state()
  public projectType?: ProjectType;

  @state()
  public group1?: GroupField;

  @state()
  public group2?: GroupField;

  @state()
  public isLoading = false;

  public override updated(props: PropertyValues<ProjectRapportageComponent>) {
    if (
      (props.has('reportType') ||
        props.has('projectType') ||
        props.has('group1') ||
        props.has('group2')) &&
      this.group1
    ) {
      this.isLoading = true;
      reportsClient
        .get(
          `reports/projecten/${this.reportType}`,
          this.group1,
          this.group2,
          this.projectType,
        )
        .then((report) => (this.report = report))
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  override render() {
    return html` <div class="row">
      <div class="row">
        <rock-reactive-form-input-control
          class="col-12 col-md-3 col-sm-5 col-lg-3"
          .control=${projectTypeControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-3 col-sm-5 col-lg-3"
          .control=${groupingControl('group1')}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-3 col-sm-5 col-lg-3"
          .control=${groupingControl('group2')}
          .entity=${this}
        ></rock-reactive-form-input-control>
      </div>

      <div class="row">
        <div class="col">
          ${this.isLoading
            ? html`<rock-loading></rock-loading>`
            : this.report && this.group1
            ? html` <table class="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>${groupingFieldOptions[this.group1]}</th>
                    <th>Totaal</th>
                    ${this.group2
                      ? html`<th>${groupingFieldOptions[this.group2]}</th>
                          <th>Aantal</th>`
                      : ''}
                  </tr>
                </thead>
                <tbody>
                  ${this.report.map(
                    ({ key, rows, total }) =>
                      html`<tr>
                          <th rowspan="${rows?.length}">
                            ${showGroupKey(this.group1!, key)}
                          </th>
                          <td rowspan="${rows?.length}">${total}</td>
                          ${renderRowData(this.group2!, rows?.[0])}
                        </tr>
                        ${rows?.slice(1).map(
                          (row) =>
                            html`<tr>
                              ${renderRowData(this.group2!, row)}
                            </tr>`,
                        )}`,
                  )}
                </tbody>
              </table>`
            : html`Kies een groep`}
        </div>
      </div>
    </div>`;

    function renderRowData(group: GroupField, row: ReportRow | undefined) {
      if (row) {
        const { key, count } = row;
        return html`<td>${showGroupKey(group, key)}</td>
          <td>${count}</td>`;
      }
    }
  }
}

function groupingControl<TName extends 'group1' | 'group2'>(name: TName) {
  return selectControl<ProjectRapportageComponent, TName>(
    name,
    groupingFieldOptions,
    { placeholder: name === 'group1' ? 'Groepeer op...' : '...en daarna op' },
  );
}
const projectTypeControl = selectControl<
  ProjectRapportageComponent,
  'projectType'
>('projectType', projectTypes, { placeholder: 'Project type...' });

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
