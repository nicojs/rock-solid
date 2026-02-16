import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  AanmeldingGroupField,
  aanmeldingGroupingFieldOptions,
  Report,
  Organisatieonderdeel,
  ProjectType,
  projectTypes,
  ReportRow,
  Werksituatie,
  werksituaties,
  AanmeldingReportType,
  organisatieonderdelen,
  Aanmeldingsstatus,
  aanmeldingLabels,
  aanmeldingsstatussen,
  ActiviteitReportType,
  isAanmeldingReportType,
  activiteitGroupingFieldOptions,
  isActiviteitGroupingField,
  isActiviteitReportType,
  woonsituaties,
  Woonsituatie,
  toCsv,
  Provincie,
  Doelgroep,
  doelgroepen,
  cursusCategorieën,
  CursusCategorie,
} from '@rock-solid/shared';
import { reportsClient } from './reports-client';
import { html, nothing, PropertyValues } from 'lit';
import {
  CheckboxInputControl,
  InputType,
  NumberInputControl,
  checkboxesItemsControl,
  selectControl,
  tagsControl,
} from '../forms';
import {
  downloadCsv,
  provinciesTypeAheadHints,
  show,
  showOrganisatieonderdeel,
  showProvincie,
  unknown,
} from '../shared';
import { formStyles } from '../forms/reactive-form.component';

const GROUP1_TITLE = 'Totaal';
const GROUP2_TITLE = 'Aantal';

@customElement('rock-rapportage')
export class RapportageComponent extends RockElement {
  static override styles = [bootstrap, formStyles];

  @property()
  public reportType!: AanmeldingReportType | ActiviteitReportType;

  @state()
  public report?: Report;

  @state()
  public projectType?: ProjectType;

  @state()
  public group1?: AanmeldingGroupField;

  @state()
  public group2?: AanmeldingGroupField;

  @state()
  public enkelEersteAanmeldingen?: boolean;

  @state()
  public organisatieonderdeel?: Organisatieonderdeel;

  @state()
  public doelgroepen?: Doelgroep[];

  @state()
  public categorieen?: CursusCategorie[];

  @state()
  public enkelJaar?: number;

  @state()
  public aanmeldingsstatus?: Aanmeldingsstatus;

  @state()
  public provincies?: Provincie[];

  @state()
  public isLoading = false;

  public override update(props: PropertyValues<RapportageComponent>) {
    if (
      props.has('reportType') ||
      props.has('projectType') ||
      props.has('group1') ||
      props.has('group2') ||
      props.has('enkelEersteAanmeldingen') ||
      props.has('enkelJaar') ||
      props.has('organisatieonderdeel') ||
      props.has('doelgroepen') ||
      props.has('aanmeldingsstatus') ||
      props.has('categorieen') ||
      props.has('provincies')
    ) {
      if (isActiviteitReportType(this.reportType)) {
        if (this.group1 && !isActiviteitGroupingField(this.group1)) {
          this.group1 = undefined;
        }
        if (this.group2 && !isActiviteitGroupingField(this.group2)) {
          this.group2 = undefined;
        }
      }
      if (this.group1) {
        let reportRequest;
        switch (this.reportType) {
          case 'aanmeldingen':
          case 'deelnames':
          case 'deelnemersuren':
          case 'deelnemersurenPrognose':
            reportRequest = reportsClient.get(
              `reports/aanmeldingen/${this.reportType}`,
              this.group1,
              this.group2,
              {
                enkelEersteAanmeldingen: this.enkelEersteAanmeldingen,
                organisatieonderdeel: this.organisatieonderdeel,
                type: this.projectType,
                jaar: this.enkelJaar,
                categorieen: this.categorieen,
                aanmeldingsstatus: this.aanmeldingsstatus,
                doelgroepen: this.doelgroepen,
                provincies: this.provincies,
              },
            );
            break;
          case 'begeleidingsuren':
          case 'vormingsuren':
            reportRequest = reportsClient.get(
              `reports/activiteiten/${this.reportType}`,
              this.group1,
              this.group2,
              {
                organisatieonderdeel: this.organisatieonderdeel,
                type: this.projectType,
                jaar: this.enkelJaar,
                categorieen: this.categorieen,
                doelgroepen: this.doelgroepen,
                provincies: this.provincies,
              },
            );
            break;
        }
        this.isLoading = true;
        void reportRequest
          .then((report) => (this.report = report))
          .finally(() => {
            this.isLoading = false;
          });
      }
    }
    super.update(props);
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
            key: aanmeldingGroupingFieldOptions[this.group1],
            total: GROUP1_TITLE,
            rowKey: aanmeldingGroupingFieldOptions[this.group2],
            rowCount: GROUP2_TITLE,
          },
          {},
        );
      } else {
        csv = toCsv(
          this.report,
          ['key', 'total'],
          {
            key: aanmeldingGroupingFieldOptions[this.group1],
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
    return html` <fieldset class="mt-3 p-2 mb-3 border border-success-subtle">
        <legend class="h6 text-success-emphasis">Groeperen</legend>
        <div class="row">
          <rock-reactive-form-input-control
            class="col-12 col-md-3 col-sm-5 col-lg-3"
            .control=${groupingControl('group1', this.reportType)}
            .entity=${this}
          ></rock-reactive-form-input-control>
          <rock-reactive-form-input-control
            class="col-12 col-md-3 col-sm-5 col-lg-3"
            .control=${groupingControl('group2', this.reportType)}
            .entity=${this}
          ></rock-reactive-form-input-control>
        </div>
      </fieldset>
      <fieldset class="mt-3 p-2 mb-3 border border-info-subtle">
        <legend class="h6 text-info-emphasis">Filteren</legend>
        <div class="row">
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

          ${reportRoot(this.reportType) === 'aanmeldingen'
            ? html`<rock-reactive-form-input-control
                  class="col-12 col-md-4 col-sm-6"
                  .control=${aanmeldingsstatusControl}
                  .entity=${this}
                ></rock-reactive-form-input-control>
                <rock-reactive-form-input-control
                  class="col-12 col-md-4 col-sm-6"
                  .control=${enkelNieuwkomersControl}
                  .entity=${this}
                ></rock-reactive-form-input-control>`
            : nothing}
        </div>
        <div class="row p-3 pb-0">
          <rock-reactive-form-tags
            class="col-8 col-sm-12"
            .control=${tagsControl<RapportageComponent, 'provincies'>(
              'provincies',
              (p) => p,
              provinciesTypeAheadHints,
              { minCharacters: 0 },
            )}
            .entity=${this}
          ></rock-reactive-form-tags>
        </div>
        <div class="row p-3">
          <rock-reactive-checkboxes
            class="pt-2 col-12 col-md-6 border ml-2"
            labelClasses="col-auto"
            .control=${categorieFilterControl}
            .entity=${this}
          ></rock-reactive-checkboxes>
          <rock-reactive-checkboxes
            class="pt-2 col-12 col-md-6 border"
            labelClasses="col-auto"
            .control=${doelgroepenFilterControl}
            .entity=${this}
          ></rock-reactive-checkboxes>
        </div>
      </fieldset>

      <div class="mt-3 p-2 mb-3 border border-light-subtle">
        <div class="row">
          <div class="col">
            <h6>Resultaten</h6>

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
                          <th>
                            ${aanmeldingGroupingFieldOptions[this.group1]}
                          </th>
                          <th>${GROUP1_TITLE}</th>
                          ${this.group2
                            ? html`<th>
                                  ${aanmeldingGroupingFieldOptions[this.group2]}
                                </th>
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
                : html`<p class="text-muted">
                    Nog geen rapport geladen. Kies bij "Groeperen" ten minste 1
                    groep om te starten.
                  </p>`}
          </div>
        </div>
      </div>`;

    function renderRowData(
      group: AanmeldingGroupField,
      row: ReportRow | undefined,
    ) {
      if (row) {
        const { key, count } = row;
        return html`<td>${showGroupKey(group, key)}</td>
          <td>${count}</td>`;
      }
    }
  }
}

function groupingControl<TName extends 'group1' | 'group2'>(
  name: TName,
  reportType: AanmeldingReportType | ActiviteitReportType,
) {
  return selectControl<RapportageComponent, TName>(
    name,
    isAanmeldingReportType(reportType)
      ? aanmeldingGroupingFieldOptions
      : (activiteitGroupingFieldOptions as Readonly<
          Record<RapportageComponent[TName] & string, string>
        >),
    { placeholder: name === 'group1' ? 'Groepeer op...' : '...en daarna op' },
  );
}
const projectTypeControl = selectControl<RapportageComponent, 'projectType'>(
  'projectType',
  projectTypes,
  { placeholder: 'Project type...' },
);
const projectJaarControl: NumberInputControl<RapportageComponent> = {
  name: 'enkelJaar',
  type: InputType.number,
  label: 'Enkel in jaar...',
  placeholder: 'Enkel in jaar...',
  step: 1,
};

const aanmeldingsstatusControl = selectControl<
  RapportageComponent,
  'aanmeldingsstatus'
>('aanmeldingsstatus', aanmeldingsstatussen, {
  placeholder: 'Alle aanmeldingen',
  label: aanmeldingLabels.status,
});

const organisatieonderdeelFilterControl = selectControl<
  RapportageComponent,
  'organisatieonderdeel'
>('organisatieonderdeel', organisatieonderdelen, {
  placeholder: 'Enkel organisatieonderdeel...',
});

const doelgroepenFilterControl = checkboxesItemsControl<
  RapportageComponent,
  'doelgroepen'
>('doelgroepen', doelgroepen);

const categorieFilterControl = checkboxesItemsControl<
  RapportageComponent,
  'categorieen'
>('categorieen', cursusCategorieën, {
  label: 'Categorie',
});

const enkelNieuwkomersControl: CheckboxInputControl<RapportageComponent> = {
  name: 'enkelEersteAanmeldingen',
  type: InputType.checkbox,
  label: 'Enkel eerste aanmeldingen',
};

function showGroupKey(
  group: AanmeldingGroupField,
  key: string | undefined,
): string {
  switch (group) {
    case 'jaar':
    case 'project':
    case 'geslacht':
      return show(key, unknown);
    case 'provincie':
      return showProvincie(
        (typeof key === 'string' && (key as Provincie)) || undefined,
      );
    case 'organisatieonderdeel':
      return showOrganisatieonderdeel(key as Organisatieonderdeel | undefined);
    case 'woonsituatie':
      return key ? woonsituaties[key as Woonsituatie] : unknown;
    case 'werksituatie':
      return key ? werksituaties[key as Werksituatie] : unknown;
    case 'categorie':
      return key
        ? cursusCategorieën[key as keyof typeof cursusCategorieën]
        : '';
  }
}
function reportRoot<
  TReport extends AanmeldingReportType | ActiviteitReportType,
>(
  reportType: TReport,
): TReport extends AanmeldingReportType ? 'aanmeldingen' : 'activiteiten' {
  switch (reportType) {
    case 'aanmeldingen':
    case 'deelnames':
    case 'deelnemersurenPrognose':
    case 'deelnemersuren':
      return 'aanmeldingen' as TReport extends AanmeldingReportType
        ? 'aanmeldingen'
        : 'activiteiten';
    case 'begeleidingsuren':
    case 'vormingsuren':
      return 'activiteiten' as TReport extends AanmeldingReportType
        ? 'aanmeldingen'
        : 'activiteiten';
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown report type ${reportType satisfies never}`);
  }
}
