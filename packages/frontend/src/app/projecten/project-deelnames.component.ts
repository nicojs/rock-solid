import {
  Activiteit,
  Deelnemer,
  Project,
  UpsertableDeelname,
} from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { showDatum } from '../shared';
import { printProject } from './project.pipes';
import { projectService } from './project.service';

@customElement('kei-project-deelnames')
export class ProjectDeelnamesComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path!: string[];

  @property({ attribute: false })
  public project!: Project;

  @state()
  public activiteit?: Activiteit;

  @state()
  public deelnames?: UpsertableDeelname[];

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
                  (deelname) => deelname.deelnemerId === inschrijving.persoonId,
                ),
            )
            .map(
              (inschrijving): UpsertableDeelname => ({
                activiteitId,
                deelnemerId: inschrijving.persoonId,
                effectieveDeelnamePerunage: 1,
                deelnemer: inschrijving.persoon as Deelnemer,
              }),
            ),
        ];
      });
    }
  }

  public override render() {
    return html`<h2>
        ${printProject(this.project)} ${showDatum(this.activiteit?.van)}
        deelnames
      </h2>
      ${this.deelnames?.map(
        (deelname) => html`${deelname.deelnemer?.achternaam}`,
      )}`;
  }
}
