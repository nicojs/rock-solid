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
  deelnemer: Deelnemer;
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
      this.activiteit = this.project.activiteiten.find(
        (act) => act.id === activiteitId,
      );

      Promise.all([
        projectService.getInschrijvingen(this.project.id),
        projectService.getDeelnames(this.project.id, activiteitId),
      ]).then(([inschrijvingen, deelnames]) => {
        this.deelnames = [
          ...deelnames,
          ...inschrijvingen
            .filter(
              (inschrijving) =>
                !deelnames.find(
                  ({ inschrijvingId }) => inschrijvingId === inschrijving.id,
                ),
            )
            .map(
              (inschrijving): DeelnameRow => ({
                activiteitId,
                inschrijvingId: inschrijving.id,
                effectieveDeelnamePerunage: 1,
                deelnemer: inschrijving.deelnemer!,
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
            ${this.deelnames?.map(
              (deelname) =>
                html`<rock-reactive-form-control
                  .entity=${deelname}
                  .control=${createDeelnameFormControl(deelname)}
                ></rock-reactive-form-control>`,
            )}
            <button class="btn btn-primary offset-sm-2" type="submit">
              Deelnames bevestigen
            </button>
          </form>`}`;
  }
}

function createDeelnameFormControl(
  deelname: DeelnameRow,
): InputControl<UpsertableDeelname> {
  return {
    name: 'effectieveDeelnamePerunage',
    label: fullName(deelname.deelnemer),
    type: InputType.number,
    step: 0.01,
    validators: {
      max: 1,
      min: 0,
    },
  };
}
