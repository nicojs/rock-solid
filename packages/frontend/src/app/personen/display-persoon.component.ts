import {
  Cursus,
  Deelnemer,
  OverigPersoon,
  Persoon,
  persoonLabels,
  Project,
  Vakantie,
  voedingswensen,
} from '@rock-solid/shared';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import {
  showFoldervoorkeurBadges,
  restClient,
  show,
  showAdres,
  showDatum,
  showOverigPersoonSelectie,
} from '../shared';
import { age, fullName } from './full-name.pipe';

@customElement('rock-display-persoon')
export class DisplayPersoonComponent extends RockElement {
  @property({ attribute: false })
  private persoon!: Persoon;

  @state()
  private cursussen?: Project[];
  @state()
  private vakanties?: Vakantie[];

  static override styles = [bootstrap];

  protected override firstUpdated(): void {
    if (this.persoon.type === 'deelnemer') {
      restClient
        .getAll(`personen/${this.persoon.id}/aanmeldingen`, {
          type: 'cursus',
        })
        .then((cursussen) => (this.cursussen = cursussen as Cursus[]));
      restClient
        .getAll(`personen/${this.persoon.id}/aanmeldingen`, {
          type: 'vakantie',
        })
        .then((vakanties) => (this.vakanties = vakanties as Vakantie[]));
    } else {
      restClient
        .getAll(`personen/${this.persoon.id}/begeleid`, {
          type: 'cursus',
        })
        .then((cursussen) => (this.cursussen = cursussen as Cursus[]));
      restClient
        .getAll(`personen/${this.persoon.id}/begeleid`, {
          type: 'vakantie',
        })
        .then((vakanties) => (this.vakanties = vakanties as Vakantie[]));
    }
  }

  override render() {
    return html` <h3>Persoonsgegevens</h3>
      <div class="row">
        <dl class="col-sm-6">
          <dt>Naam</dt>
          <dd>${fullName(this.persoon)}</dd>
          ${this.renderDefinition('emailadres')}
          <dt>Geboortedatum</dt>
          <dd>
            ${showDatum(this.persoon.geboortedatum)}${this.persoon.geboortedatum
              ? ` (${age(this.persoon.geboortedatum)} jaar)`
              : nothing}
          </dd>
          <dt>${persoonLabels.geslacht}</dt>
          <dd>
            ${show(this.persoon.geslacht)}${this.persoon.geslachtOpmerking
              ? ` (${this.persoon.geslachtOpmerking})`
              : nothing}
          </dd>
          ${this.persoon.type === 'deelnemer'
            ? this.renderDeelnemerProperties(this.persoon)
            : this.renderOverigPersoonProperties(this.persoon)}
        </dl>
        <dl class="col-sm-6">
          ${this.renderDefinition('rijksregisternummer')}
          ${this.renderDefinition('telefoonnummer')}
          <dt>Voedingswens</dt>
          <dd>${voedingswensen[this.persoon.voedingswens]}</dd>
          <dt>Verblijfadres</dt>
          <dl>${showAdres(this.persoon.verblijfadres)}</dl>
          <dt>Domicilieadres</dt>
          <dl>
            ${this.persoon.domicilieadres
              ? showAdres(this.persoon.domicilieadres)
              : 'Zelfde als verblijfadres'}
          </dl>
        </dl>
      </div>
      ${this.persoon.type === 'deelnemer'
        ? this.renderAanmeldingen()
        : this.renderBegeleiding()}`;
  }

  private renderAanmeldingen() {
    return html`<h3>Ingeschreven in cursussen</h3>
      ${this.renderProjectListRow(this.cursussen)}
      <h3>Ingeschreven in vakanties</h3>
      ${this.renderProjectListRow(this.vakanties)}`;
  }

  private renderBegeleiding() {
    return html`<h3>Begeleiding cursussen</h3>
      ${this.renderProjectListRow(this.cursussen)}
      <h3>Begeleiding vakanties</h3>
      ${this.renderProjectListRow(this.vakanties)}`;
  }

  private renderProjectListRow(projecten: Project[] | undefined) {
    return html`<div class="row">
      <div class="col">
        ${projecten
          ? html`<rock-projecten-list
              .projecten=${projecten}
            ></rock-projecten-list>`
          : html`<rock-loading></rock-loading>`}
      </div>
    </div>`;
  }

  private renderDefinition<T extends keyof Persoon>(key: T) {
    return html`
      <dt>${persoonLabels[key]}</dt>
      <dd>${show(this.persoon[key])}</dd>
    `;
  }

  private renderDeelnemerProperties(deelnemer: Deelnemer) {
    return html`
      <dt>Woonsituatie</dt>
      <dd>${show(deelnemer.woonsituatie)}</dd>
      ${deelnemer.woonsituatieOpmerking
        ? html`<dt>Opmerking</dt>
            <dd>${show(deelnemer.woonsituatieOpmerking)}</dd>`
        : nothing}
    `;
  }
  private renderOverigPersoonProperties(persoon: OverigPersoon) {
    return html`
      <dt>Selectie</dt>
      <dd>${showOverigPersoonSelectie(persoon.selectie)}</dd>
      <dt>Foldervoorkeuren</dt>
      <dd>${showFoldervoorkeurBadges(persoon.foldervoorkeuren)}</dd>
    `;
  }
}
