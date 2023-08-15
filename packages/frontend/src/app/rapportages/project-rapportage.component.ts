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
  ProjectenReportType,
  organisatieonderdelen,
  OvernachtingDescription,
  overnachtingDescriptions,
  Aanmeldingsstatus,
  aanmeldingLabels,
  aanmeldingsstatussen,
} from '@rock-solid/shared';
import { reportsClient } from './reports-client';
import { html, PropertyValues } from 'lit';
import {
  CheckboxInputControl,
  InputType,
  NumberInputControl,
  selectControl,
} from '../forms';
import {
  downloadCsv,
  show,
  showOrganisatieonderdeel,
  showProvincie,
  toCsv,
} from '../shared';

const GROUP1_TITLE = 'Totaal';
const GROUP2_TITLE = 'Aantal';

@customElement('rock-project-rapportage')
export class ProjectRapportageComponent extends RockElement {
  static override styles = [bootstrap];

  @property()
  public reportType!: ProjectenReportType;

  @state()
  public report?: ProjectReport;

  @state()
  public projectType?: ProjectType;

  @state()
  public group1?: GroupField;

  @state()
  public group2?: GroupField;

  @state()
  public enkelEersteAanmeldingen?: boolean;

  @state()
  public enkelOrganisatieonderdeel?: Organisatieonderdeel;

  @state()
  public overnachting?: OvernachtingDescription;

  @state()
  public enkelJaar?: number;

  @state()
  public aanmeldingsstatus?: Aanmeldingsstatus;

  @state()
  public isLoading = false;

  public override updated(props: PropertyValues<ProjectRapportageComponent>) {
    if (
      (props.has('reportType') ||
        props.has('projectType') ||
        props.has('group1') ||
        props.has('group2') ||
        props.has('enkelEersteAanmeldingen') ||
        props.has('enkelJaar') ||
        props.has('enkelOrganisatieonderdeel') ||
        props.has('aanmeldingsstatus') ||
        props.has('overnachting')) &&
      this.group1
    ) {
      this.isLoading = true;
      reportsClient
        .get(`reports/projecten/${this.reportType}`, this.group1, this.group2, {
          enkelEersteAanmeldingen: this.enkelEersteAanmeldingen,
          organisatieonderdeel: this.enkelOrganisatieonderdeel,
          type: this.projectType,
          jaar: this.enkelJaar,
          overnachting: this.overnachting,
          aanmeldingsstatus: this.aanmeldingsstatus,
        })
        .then((report) => (this.report = report))
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  private downloadReport = () => {
    if (this.report && this.group1) {
      let csv;
      if (this.group2) {
        csv = toCsv(
          this.report.flatMap((group) =>
            group.rows!.map((row) => ({
              ...group,
              rowKey: row.key,
              rowCount: row.count,
            })),
          ),
          ['key', 'total', 'rowKey', 'rowCount'],
          {
            key: groupingFieldOptions[this.group1],
            total: GROUP1_TITLE,
            rowKey: groupingFieldOptions[this.group2],
            rowCount: GROUP2_TITLE,
          },
          {},
        );
      } else {
        csv = toCsv(
          this.report,
          ['key', 'total'],
          {
            key: groupingFieldOptions[this.group1],
            total: GROUP1_TITLE,
          },
          {},
        );
      }
      downloadCsv(
        csv,
        `${this.reportType}-per-${this.group1}${
          this.group2 ? `-en-${this.group2}` : ''
        }`,
      );
    }
  };

  override render() {
    return html`<div class="row">
      <fieldset class="row mt-3 mb-3 ">
        <legend class="h6">Groeperen</legend>

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
      </fieldset>
      <fieldset class="row mb-3">
        <legend class="h6">Filteren</legend>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${projectTypeControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${projectJaarControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${organisatieonderdeelFilterControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${enkelNieuwkomersControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${overnachtingControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
        <rock-reactive-form-input-control
          class="col-12 col-md-4 col-sm-6"
          .control=${aanmeldingsstatusControl}
          .entity=${this}
        ></rock-reactive-form-input-control>
      </fieldset>

      <div class="row">
        <div class="col">
          ${this.isLoading
            ? html`<rock-loading></rock-loading>`
            : this.report && this.group1
            ? html` <button
                  @click=${this.downloadReport}
                  class="btn btn-outline-secondary"
                >
                  <rock-icon icon="download"></rock-icon> Export
                </button>
                <table class="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>${groupingFieldOptions[this.group1]}</th>
                      <th>${GROUP1_TITLE}</th>
                      ${this.group2
                        ? html`<th>${groupingFieldOptions[this.group2]}</th>
                            <th>${GROUP2_TITLE}</th>`
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
const projectJaarControl: NumberInputControl<ProjectRapportageComponent> = {
  name: 'enkelJaar',
  type: InputType.number,
  label: 'Enkel in jaar...',
  placeholder: 'Enkel in jaar...',
  step: 1,
};

const overnachtingControl = selectControl<
  ProjectRapportageComponent,
  'overnachting'
>('overnachting', overnachtingDescriptions, {
  placeholder: 'Met en zonder overnachting',
  label: 'Overnachting',
});

const aanmeldingsstatusControl = selectControl<
  ProjectRapportageComponent,
  'aanmeldingsstatus'
>('aanmeldingsstatus', aanmeldingsstatussen, {
  placeholder: 'Alle aanmeldingen',
  label: aanmeldingLabels.status,
});

const organisatieonderdeelFilterControl = selectControl<
  ProjectRapportageComponent,
  'enkelOrganisatieonderdeel'
>('enkelOrganisatieonderdeel', organisatieonderdelen, {
  placeholder: 'Enkel organisatieonderdeel...',
});

const enkelNieuwkomersControl: CheckboxInputControl<ProjectRapportageComponent> =
  {
    name: 'enkelEersteAanmeldingen',
    type: InputType.checkbox,
    label: 'Enkel eerste aanmeldingen',
  };

function showGroupKey(group: GroupField, key: string | undefined): string {
  switch (group) {
    case 'jaar':
    case 'project':
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
