import {
  Aanmelding,
  Activiteit,
  Deelnemer,
  Project,
  UpsertableDeelname,
  showDatum,
} from '@rock-solid/shared';
import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from '../personen/persoon.pipe';
import { printProject } from './project.pipes';
import { privilege } from '../auth/privilege.directive';

interface DeelnameRow {
  deelnemer?: Deelnemer;
  deelname: UpsertableDeelname;
  isNew: boolean;
}

@customElement('rock-project-deelnames')
export class ProjectDeelnamesComponent extends LitElement {
  static override styles = [
    css`
      .indicator {
        width: 0.75rem;
        height: 0.75rem;
        display: flex;
        margin-inline-end: 0.75rem;
        margin-left: 8px;
        margin-top: 8px;
      }
    `,
    bootstrap,
  ];

  @property({ attribute: false })
  public project!: Project;

  @property({ attribute: false })
  public activiteit!: Activiteit;

  @property({ attribute: false })
  public aanmeldingen!: Aanmelding[];

  @state()
  public deelnameRows?: DeelnameRow[];

  override update(props: PropertyValues<ProjectDeelnamesComponent>) {
    if (props.has('aanmeldingen')) {
      const activiteitId = this.activiteit.id;
      this.deelnameRows = this.aanmeldingen.map((aanmelding) => {
        let isNew = false;
        let deelname: UpsertableDeelname | undefined =
          aanmelding.deelnames.find(
            (deelname) => deelname.activiteitId === this.activiteit.id,
          );
        if (!deelname) {
          isNew = true;
          deelname = {
            aanmeldingId: aanmelding.id,
            activiteitId,
            effectieveDeelnamePerunage: 1,
          };
        }
        return {
          isNew,
          deelname,
          deelnemer: aanmelding.deelnemer,
        };
      });
    }
    super.update(props);
  }

  @state()
  private wasValidated = false;

  @state()
  private isLoading = false;

  async submit(e: SubmitEvent) {
    e.preventDefault();
    if ((e.target as HTMLFormElement).checkValidity()) {
      this.isLoading = true;
      this.wasValidated = false;
      this.dispatchEvent(
        new CustomEvent('deelnames-submitted', {
          detail: this.deelnameRows?.map((d) => d.deelname),
        }),
      );
    } else {
      this.wasValidated = true;
    }
  }

  public override render() {
    return html`<h2>
        ${printProject(this.project)} ${showDatum(this.activiteit?.van)}
        deelnames
      </h2>
      ${this.isLoading
        ? html`<rock-loading></rock-loading>`
        : html`<form
            novalidate
            class="${this.wasValidated ? 'was-validated' : ''}"
            @submit="${(e: SubmitEvent) => this.submit(e)}"
          >
            ${this.deelnameRows?.map(
              ({ deelname, deelnemer, isNew }, index) => {
                const deelnameControl: InputControl<UpsertableDeelname> = {
                  name: 'effectieveDeelnamePerunage',
                  label: deelnemer
                    ? fullName(deelnemer)
                    : 'Deelnemer verwijderd',
                  type: InputType.number,
                  step: 0.01,
                  validators: {
                    max: 1,
                    min: 0,
                    required: true,
                  },
                };
                const opmerkingControl: InputControl<UpsertableDeelname> = {
                  name: 'opmerking',
                  type: InputType.text,
                  placeholder: 'Opmerking',
                };
                return html`<div class="mb-3 row">
                  <label
                    class="col-lg-2 col-md-4 col-sm-8 form-label position-relative d-flex"
                    for="${index}_${deelnameControl.name}"
                    >${deelnameControl.label}${isNew
                      ? html`
                          <span
                            title="Nieuwe deelname voor ${deelnameControl.label}"
                            class="indicator bg-primary rounded-circle"
                          >
                            <span class="visually-hidden">New alerts</span>
                          </span>
                        `
                      : nothing}</label
                  >
                  <rock-reactive-form-input-control
                    class="col-lg-2 col-md-3 col-sm-4"
                    path="${index}"
                    .entity=${deelname}
                    .control=${deelnameControl}
                  ></rock-reactive-form-input-control>
                  <rock-reactive-form-input-control
                    class="col-lg-8 col-md-5 col-sm-12"
                    path="${index}"
                    .entity=${deelname}
                    .control=${opmerkingControl}
                  ></rock-reactive-form-input-control>
                </div>`;
              },
            )}
            <button
              ${privilege('write:deelnames')}
              class="btn btn-primary offset-sm-2"
              type="submit"
            >
              Deelnames bevestigen
            </button>
          </form>`}`;
  }
}
