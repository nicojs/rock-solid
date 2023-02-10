import {
  Activiteit,
  Deelnemer,
  Project,
  UpsertableDeelname,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from '../personen/full-name.pipe';
import { router } from '../router';
import { pluralize, showDatum } from '../shared';
import { printProject } from './project.pipes';
import { projectService } from './project.service';
import { projectenStore } from './projecten.store';

interface DeelnameRow extends UpsertableDeelname {
  deelnemer?: Deelnemer;
}

@customElement('rock-project-deelnames')
export class ProjectDeelnamesComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path!: string[];

  @property({ attribute: false })
  public project!: Project;

  @state()
  public activiteit?: Activiteit;

  @state()
  public deelnames?: DeelnameRow[];

  override updated(props: PropertyValues<ProjectDeelnamesComponent>) {
    if (props.has('path') && this.path[0]) {
      const activiteitId = +this.path[0];
      // @ts-expect-error "This expression is not callable"-nonsense
      this.activiteit = this.project.activiteiten.find(
        (act: Activiteit) => act.id === activiteitId,
      );

      Promise.all([
        projectService.getAanmeldingen(this.project.id),
        projectService.getDeelnames(this.project.id, activiteitId),
      ]).then(([aanmeldingen, deelnames]) => {
        this.deelnames = [
          ...deelnames,
          ...aanmeldingen
            .filter(
              (aanmelding) =>
                !deelnames.find(
                  ({ aanmeldingId }) => aanmeldingId === aanmelding.id,
                ),
            )
            .map(
              (aanmelding): DeelnameRow => ({
                activiteitId,
                aanmeldingId: aanmelding.id,
                effectieveDeelnamePerunage: 1,
                deelnemer: aanmelding.deelnemer!,
              }),
            ),
        ];
      });
    }
  }

  @state()
  private wasValidated = false;

  @state()
  private isLoading = false;

  async submit(e: SubmitEvent) {
    e.preventDefault();
    if ((e.target as HTMLFormElement).checkValidity() && this.activiteit) {
      this.isLoading = true;
      this.wasValidated = false;
      projectenStore
        .updateDeelnames(this.project.id, this.activiteit.id, this.deelnames!)
        .subscribe(() => {
          router.navigate(`/${pluralize(this.project.type)}/list`);
        });
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
            @submit="${this.submit}"
          >
            ${this.deelnames?.map((deelname) => {
              const deelnameControl: InputControl<UpsertableDeelname> = {
                name: 'effectieveDeelnamePerunage',
                label: deelname.deelnemer
                  ? fullName(deelname.deelnemer)
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
                <label class="col-lg-2 col-md-4" for="${deelnameControl.name}"
                  >${deelnameControl.label}</label
                >
                <rock-reactive-form-input-control
                  class="col-lg-1 col-md-1"
                  .entity=${deelname}
                  .control=${deelnameControl}
                ></rock-reactive-form-input-control>
                <rock-reactive-form-input-control
                  class="col-lg-9 col-md-9"
                  .entity=${deelname}
                  .control=${opmerkingControl}
                ></rock-reactive-form-input-control>
              </div>`;
            })}
            <button class="btn btn-primary offset-sm-2" type="submit">
              Deelnames bevestigen
            </button>
          </form>`}`;
  }
}
