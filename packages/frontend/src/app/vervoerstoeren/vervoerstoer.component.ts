import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { html, PropertyValues } from 'lit';
import {
  Aanmelding,
  Deelnemer,
  Locatie,
  notEmpty,
  OverigPersoon,
  Project,
  UpsertableVervoerstoer,
  Vervoerstoer,
} from '@rock-solid/shared';
import { projectService } from '../projecten/project.service';
import { printProject } from '../projecten/project.pipes';
import { bootstrap } from '../../styles';
import { persoonService } from '../personen/persoon.service';
import { router } from '../router';
import { vervoerstoerService } from './vervoerstoer.service';

const ACTIVE_STATUSSEN = Object.freeze(['Bevestigd', 'Aangemeld']);
type VervoerstoerStep =
  | 'opstapplaatsen-kiezen'
  | 'routes-selecteren'
  | 'tijdsplanning';

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

  get step2Enabled(): boolean {
    return (
      Boolean(this.vervoerstoer.bestemming) &&
      (this.aanmeldingen?.every((aanmelding) =>
        Boolean(aanmelding.opstapplaats),
      ) ??
        false)
    );
  }

  get step3Enabled(): boolean {
    return (this.vervoerstoer?.routes.length ?? 0) > 0;
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
    const projectIds = this.vervoerstoer.projectIds;
    await Promise.all(
      this.deelnemers
        .map(async (deelnemer) => {
          if (deelnemer) {
            await persoonService.patchPersoon(deelnemer.id, {
              id: deelnemer.id,
              mogelijkeOpstapplaatsen: deelnemer.mogelijkeOpstapplaatsen,
            });
          }
        })
        .concat(
          ...projectIds.map(async (projectId) => {
            await projectService.patchAanmeldingen(
              projectId,
              this.aanmeldingen!.filter(
                (aanmelding) => aanmelding.projectId === projectId,
              ).map(({ id, opstapplaats }) => ({
                id,
                opstapplaats: opstapplaats ?? null,
              })),
            );
          }),
        ),
    );
    this.isLoading = false;
  }

  async saveAndNavigateToRoutes() {
    await this.save();
    // Update vervoerstoer with current bestemming
    this.vervoerstoer = await vervoerstoerService.update({
      ...this.vervoerstoer,
      id: this.vervoerstoer.id,
    });
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
      <h2>Vervoerstoer wijzigen</h2>
      <p>
        Projecten geselecteerd:
        ${this.projecten.map(
          (project) =>
            html`<span class="ms-2 badge text-bg-secondary"
              >${printProject(project)}</span
            >`,
        )}
      </p>
      <ul class="nav nav-tabs mb-3">
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
      </ul>
      ${this.step === 'tijdsplanning'
        ? this.renderTijdsplanning()
        : this.step === 'routes-selecteren'
          ? this.renderRoutesSelecteren()
          : this.renderOpstapplaatsenKiezen()}
    `;
  }

  private get bestemmingLocaties(): Locatie[] {
    return (
      this.projecten
        ?.flatMap((p) => p.activiteiten.map((a) => a.locatie))
        .filter(notEmpty)
        .filter(
          (value, index, self) =>
            self.findIndex((val) => val.id === value.id) === index,
        ) ?? []
    );
  }

  private renderOpstapplaatsenKiezen() {
    return html`<rock-opstapplaatsen-kiezen
      .deelnemers=${this.deelnemers}
      .opstapplaatsen=${this.opstapplaatsen}
      .vervoerstoer=${this.vervoerstoer}
      .bestemmingLocaties=${this.bestemmingLocaties}
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
    const opstapplaatsenMetAanmeldingen = this.opstapplaatsen.map(
      (locatie) => ({
        locatie,
        aanmeldingen:
          this.aanmeldingen?.filter((a) => a.opstapplaats?.id === locatie.id) ??
          [],
      }),
    );
    return html`<rock-routes-selecteren
      .opstapplaatsen=${opstapplaatsenMetAanmeldingen}
      .vervoerstoer=${this.vervoerstoer}
      @vervoerstoer-saved=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail, 'tijdsplanning')}
    ></rock-routes-selecteren>`;
  }

  private renderTijdsplanning() {
    return html`<rock-tijdsplanning
      .vervoerstoer=${this.vervoerstoer}
      .baseDatum=${this.projecten?.[0]?.activiteiten[0]?.van}
      @vervoerstoer-saved=${(e: CustomEvent<UpsertableVervoerstoer>) =>
        this.handleVervoerstoerSaved(e.detail)}
    ></rock-tijdsplanning>`;
  }
}
