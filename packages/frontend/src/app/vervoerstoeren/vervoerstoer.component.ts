import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { html, PropertyValues } from 'lit';
import {
  Aanmelding,
  Deelnemer,
  Locatie,
  notEmpty,
  Project,
  UpsertableVervoerstoer,
  Vervoerstoer,
  VervoerstoerStop,
} from '@rock-solid/shared';
import { projectService } from '../projecten/project.service';
import { printProject } from '../projecten/project.pipes';
import { bootstrap } from '../../styles';
import { persoonService } from '../personen/persoon.service';
import { router } from '../router';
import { vervoerstoerService } from './vervoerstoer.service';
import type { OpstapplaatsInfo } from './routes-selecteren.component';

const ACTIVE_STATUSSEN = Object.freeze(['Bevestigd', 'Aangemeld']);
type VervoerstoerStep =
  | 'opstapplaatsen-kiezen'
  | 'routes-selecteren'
  | 'tijdsplanning'
  | 'printen';

@customElement('rock-vervoerstoer')
export class VervoerstoerComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @property({ type: Boolean })
  enkelVakanties = false;

  @property()
  routePrefix = '';

  @property()
  step: VervoerstoerStep = 'opstapplaatsen-kiezen';

  @state()
  projecten?: Project[];

  @state()
  aanmeldingen?: Aanmelding[];

  @state()
  deelnemers: Deelnemer[] = [];

  @state()
  opstapplaatsen: Locatie[] = [];

  aanmeldingenPerDeelnemerId: Map<number, Aanmelding[]> = new Map();

  private get bestemmingStop(): VervoerstoerStop | undefined {
    return this.vervoerstoer.bestemmingStop;
  }

  get step2Enabled(): boolean {
    return (
      Boolean(this.bestemmingStop) &&
      (this.aanmeldingen?.every((aanmelding) =>
        this.isAanmeldingToegewezen(aanmelding),
      ) ??
        false)
    );
  }

  get step3Enabled(): boolean {
    return (
      (this.vervoerstoer?.routes.length ?? 0) > 0 &&
      this.vervoerstoer.toeTeKennenStops.every(
        (stop) => stop.aanmeldersOpTePikken.length === 0,
      )
    );
  }

  private isAanmeldingToegewezen(aanmelding: Aanmelding): boolean {
    const allStops = [
      ...this.vervoerstoer.toeTeKennenStops,
      ...(this.vervoerstoer.bestemmingStop
        ? [this.vervoerstoer.bestemmingStop]
        : []),
      ...this.vervoerstoer.routes.flatMap((r) => r.stops),
    ];
    return allStops.some((stop) =>
      stop.aanmeldersOpTePikken.some((a) => a.id === aanmelding.id),
    );
  }

  protected override update(
    changedProperties: PropertyValues<VervoerstoerComponent>,
  ): void {
    if (
      changedProperties.has('vervoerstoer') &&
      changedProperties.get('vervoerstoer')?.id !== this.vervoerstoer.id
    ) {
      this.#loadProjecten();
    }
    if (
      (changedProperties.has('aanmeldingen') ||
        changedProperties.has('projecten')) &&
      this.aanmeldingen
    ) {
      this.#updateDerivedState();
    }
    super.update(changedProperties);
  }

  #updateDerivedState() {
    this.opstapplaatsen = this.aanmeldingen!.flatMap(
      (aanmelding) => aanmelding.deelnemer?.mogelijkeOpstapplaatsen || [],
    )
      .filter((plaats) => plaats.soort === 'opstapplaats')
      .filter(
        (opstapplaats) =>
          opstapplaats.geschiktVoorVakantie || !this.enkelVakanties,
      )
      .sort((a, b) => a.naam.localeCompare(b.naam));

    this.opstapplaatsen = this.opstapplaatsen.filter(
      (value, index, self) =>
        self.findIndex((val) => val.id === value.id) === index,
    );

    this.deelnemers = this.aanmeldingen!.map(
      (aanmelding) => aanmelding.deelnemer,
    )
      .filter(notEmpty)
      .filter(
        (value, index, self) =>
          value && self.findIndex((val) => val.id === value.id) === index,
      );
    this.aanmeldingenPerDeelnemerId = new Map();
    for (const aanmelding of this.aanmeldingen!) {
      if (aanmelding.deelnemerId) {
        const lijst =
          this.aanmeldingenPerDeelnemerId.get(aanmelding.deelnemerId) || [];
        lijst.push(aanmelding);
        this.aanmeldingenPerDeelnemerId.set(aanmelding.deelnemerId, lijst);
      }
    }
  }

  async #loadProjecten() {
    this.projecten = undefined;
    this.aanmeldingen = undefined;
    const projectIds = this.vervoerstoer.projectIds;
    [this.projecten, this.aanmeldingen] = await Promise.all([
      projectService.getAll({ ids: projectIds }),
      Promise.all(
        projectIds.map((id) => projectService.getAanmeldingen(id)),
      ).then((aanmeldingen) =>
        aanmeldingen
          .flat()
          .filter((aanmelding) => ACTIVE_STATUSSEN.includes(aanmelding.status)),
      ),
    ]);
  }

  @state()
  private isLoading = false;

  async save() {
    if (!this.aanmeldingen) return;
    this.isLoading = true;
    // Save mogelijkeOpstapplaatsen on deelnemers
    await Promise.all(
      this.deelnemers.map(async (deelnemer) => {
        if (deelnemer) {
          await persoonService.patchPersoon(deelnemer.id, {
            id: deelnemer.id,
            mogelijkeOpstapplaatsen: deelnemer.mogelijkeOpstapplaatsen,
          });
        }
      }),
    );
    // Save vervoerstoer with updated toeTeKennenStops
    this.vervoerstoer = await vervoerstoerService.update({
      ...this.vervoerstoer,
      id: this.vervoerstoer.id,
    });
    this.isLoading = false;
  }

  async saveAndNavigateToRoutes() {
    await this.save();
    this.navigateToStep('routes-selecteren');
  }

  async handleVervoerstoerSaved(
    vervoerstoer: UpsertableVervoerstoer,
    nextStep?: VervoerstoerStep,
  ) {
    this.isLoading = true;
    try {
      this.vervoerstoer = await vervoerstoerService.update({
        ...vervoerstoer,
        id: this.vervoerstoer.id,
      });
      if (nextStep) this.navigateToStep(nextStep);
    } finally {
      this.isLoading = false;
    }
  }

  private navigateToStep(step: VervoerstoerStep) {
    if (step === 'routes-selecteren' && !this.step2Enabled) return;
    if (step === 'tijdsplanning' && !this.step3Enabled) return;
    if (!this.routePrefix) return;
    router.navigate(`${this.routePrefix}/${step}`, { keepQuery: true });
  }

  override render() {
    if (!this.projecten || !this.aanmeldingen) {
      return html`<rock-loading></rock-loading>`;
    }
    return html`
      <h2 class="d-print-none">Vervoerstoer wijzigen</h2>
      <p class="d-print-none">
        Projecten geselecteerd:
        ${this.projecten.map(
          (project) =>
            html`<span class="ms-2 badge text-bg-secondary"
              >${printProject(project)}</span
            >`,
        )}
      </p>
      <h2 class="d-none d-print-block">
        ${this.projecten.map(
          (project) => html`<span>${printProject(project)}</span>`,
        )}
      </h2>
      <ul class="nav nav-tabs mb-3 d-print-none">
        <li class="nav-item">
          <button
            @click=${() => this.navigateToStep('opstapplaatsen-kiezen')}
            class="nav-link ${this.step === 'opstapplaatsen-kiezen'
              ? 'active'
              : ''}"
            aria-current="page"
          >
            Opstapplaatsen kiezen
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link ${this.step2Enabled ? '' : 'disabled'} ${this
              .step === 'routes-selecteren'
              ? 'active'
              : ''}"
            ?disabled=${!this.step2Enabled}
            tabindex="-1"
            @click=${() => this.saveAndNavigateToRoutes()}
          >
            Routes maken
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link ${this.step3Enabled ? '' : 'disabled'} ${this
              .step === 'tijdsplanning'
              ? 'active'
              : ''}"
            ?disabled=${!this.step3Enabled}
            tabindex="-1"
            @click=${() => this.navigateToStep('tijdsplanning')}
          >
            Tijdsplanning
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link ${this.step === 'printen' ? 'active' : ''}"
            @click=${() => this.navigateToStep('printen')}
          >
            Printen
          </button>
        </li>
      </ul>
      ${this.step === 'printen'
        ? this.renderPrinten()
        : this.step === 'tijdsplanning'
          ? this.renderTijdsplanning()
          : this.step === 'routes-selecteren'
            ? this.renderRoutesSelecteren()
            : this.renderOpstapplaatsenKiezen()}
    `;
  }

  private renderOpstapplaatsenKiezen() {
    const activiteiten = this.projecten?.flatMap((p) => p.activiteiten) ?? [];
    return html`<rock-opstapplaatsen-kiezen
      .deelnemers=${this.deelnemers}
      .opstapplaatsen=${this.opstapplaatsen}
      .vervoerstoer=${this.vervoerstoer}
      .activiteiten=${activiteiten}
      .aanmeldingenPerDeelnemerId=${this.aanmeldingenPerDeelnemerId}
      .isLoading=${this.isLoading}
      .step2Enabled=${this.step2Enabled}
      .enkelVakanties=${this.enkelVakanties}
      @save-requested=${() => this.save()}
      @save-and-next-requested=${() => this.saveAndNavigateToRoutes()}
      @opstapplaatsen-changed=${(event: CustomEvent<Locatie[]>) => {
        this.opstapplaatsen = event.detail;
      }}
      @data-changed=${() => this.requestUpdate()}
    ></rock-opstapplaatsen-kiezen>`;
  }

  private renderRoutesSelecteren() {
    // Build opstapplaatsen met aanmeldingen from toeTeKennenStops + route stops
    const aanmeldingenPerLocatie = new Map<
      number,
      { locatie: Locatie; aanmeldingen: Aanmelding[] }
    >();
    for (const stop of [
      ...this.vervoerstoer.toeTeKennenStops,
      ...this.vervoerstoer.routes.flatMap((r) => r.stops),
    ]) {
      const existing = aanmeldingenPerLocatie.get(stop.locatie.id);
      if (existing) {
        existing.aanmeldingen.push(...stop.aanmeldersOpTePikken);
      } else {
        aanmeldingenPerLocatie.set(stop.locatie.id, {
          locatie: stop.locatie,
          aanmeldingen: [...stop.aanmeldersOpTePikken],
        });
      }
    }
    const opstapplaatsenMetAanmeldingen: OpstapplaatsInfo[] = [
      ...aanmeldingenPerLocatie.values(),
    ];
    return html`<rock-routes-selecteren
      .opstapplaatsen=${opstapplaatsenMetAanmeldingen}
      .vervoerstoer=${this.vervoerstoer}
      @vervoerstoer-save-requested=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail)}
      @vervoerstoer-saved=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail, 'tijdsplanning')}
    ></rock-routes-selecteren>`;
  }

  private renderTijdsplanning() {
    return html`<rock-tijdsplanning
      .vervoerstoer=${this.vervoerstoer}
      .baseDatum=${this.vervoerstoer.datum ??
      this.projecten?.[0]?.activiteiten[0]?.van}
      .baseDatumTerug=${this.vervoerstoer.datumTerug}
      @vervoerstoer-save-requested=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail)}
      @vervoerstoer-saved=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail, 'printen')}
    ></rock-tijdsplanning>`;
  }

  private renderPrinten() {
    return html`<rock-vervoerstoer-printen
      .vervoerstoer=${this.vervoerstoer}
    ></rock-vervoerstoer-printen>`;
  }
}
