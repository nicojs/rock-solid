import {
  AanmeldingOf,
  Cursus,
  Deelnemer,
  deelnemerLabels,
  OverigPersoon,
  Persoon,
  persoonLabels,
  Project,
  Vakantie,
} from '@rock-solid/shared';
import { html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import {
  showFoldervoorkeurBadges,
  restClient,
  show,
  showAdres,
  showOverigPersoonSelectie,
  showDatumWithAge,
  pluralize,
} from '../shared';
import {
  fullName,
  showContactpersoon,
  showEmail,
  showPhoneNumber,
  showVoedingswens,
} from './persoon.pipe';
import { routesByPersoonType } from './routing-helper';
import { showLocatie } from '../locaties/locatie.pipe';

@customElement('rock-display-persoon')
export class DisplayPersoonComponent extends RockElement {
  @property({ attribute: false })
  private persoon!: Persoon;

  @state()
  private cursussen?: AanmeldingOf<Cursus>[];
  @state()
  private vakanties?: AanmeldingOf<Vakantie>[];

  static override styles = [bootstrap];

  protected override firstUpdated(): void {
    if (this.persoon.type === 'deelnemer') {
      restClient
        .getAll(`personen/${this.persoon.id}/aanmeldingen`, {
          type: 'cursus',
        })
        .then(
          (cursussen) => (this.cursussen = cursussen as AanmeldingOf<Cursus>[]),
        );
      restClient
        .getAll(`personen/${this.persoon.id}/aanmeldingen`, {
          type: 'vakantie',
        })
        .then(
          (vakanties) =>
            (this.vakanties = vakanties as AanmeldingOf<Vakantie>[]),
        );
    } else {
      restClient
        .getAll(`personen/${this.persoon.id}/begeleid`, {
          type: 'cursus',
        })
        .then(
          (cursussen) => (this.cursussen = cursussen as AanmeldingOf<Cursus>[]),
        );
      restClient
        .getAll(`personen/${this.persoon.id}/begeleid`, {
          type: 'vakantie',
        })
        .then(
          (vakanties) =>
            (this.vakanties = vakanties as AanmeldingOf<Vakantie>[]),
        );
    }
  }

  override render() {
    return html` <h3>
        Persoonsgegevens
        <rock-link
          btn
          sm
          btnOutlinePrimary
          keepQuery
          href="/${routesByPersoonType[this.persoon.type]}/edit/${this.persoon
            .id}"
          ><rock-icon icon="pencil"></rock-icon
        ></rock-link>
      </h3>
      <div class="row">
        <dl class="col-sm-6">
          <dt>Naam</dt>
          <dd>${fullName(this.persoon)}</dd>
          <dt>${pluralize(persoonLabels.emailadres)}</dt>
          <dd>
            ${showEmail(this.persoon.emailadres)}
            ${this.persoon.type === 'deelnemer'
              ? showEmail(this.persoon.emailadres2, { empty: '' })
              : nothing}
          </dd>
          ${this.renderDefinition('geboortedatum', showDatumWithAge)}
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
          ${this.renderDefinition('telefoonnummer', showPhoneNumber)}
          ${this.renderDefinition('gsmNummer', showPhoneNumber)}
          ${this.renderDefinition(
            'voedingswens',
            showVoedingswens(this.persoon),
          )}
          ${this.renderDefinition('verblijfadres', showAdres)}
          ${this.renderDefinition(
            'domicilieadres',
            this.persoon.domicilieadres
              ? showAdres(this.persoon.domicilieadres)
              : 'Zelfde als verblijfadres',
          )}
        </dl>
      </div>
      ${this.persoon.type === 'deelnemer'
        ? this.renderAanmeldingen()
        : this.renderBegeleiding()}`;
  }

  private renderAanmeldingen() {
    return html`<h3>Aangemeld voor cursussen</h3>
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

  private renderDefinition<T extends keyof Persoon>(
    key: T,
    renderFn: string | ((val: Persoon[T]) => string | TemplateResult) = show,
  ) {
    return html`
      <dt>${persoonLabels[key]}</dt>
      <dd>
        ${typeof renderFn === 'string' ? renderFn : renderFn(this.persoon[key])}
      </dd>
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
      <dt>Contactpersoon</dt>
      <dd>${showContactpersoon(deelnemer.contactpersoon)}</dd>
      <dt>${deelnemerLabels.gewensteOpstapplaats}</dt>
      <dd>${showLocatie(deelnemer.gewensteOpstapplaats)}</dd>
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
