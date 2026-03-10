import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../../rock-element';
import { css, html, PropertyValues } from 'lit';
import {
  Aanmelding,
  Deelnemer,
  Locatie,
  notEmpty,
  OverigPersoon,
  Project,
  ProjectType,
} from '@rock-solid/shared';
import { projectService } from '../project.service';
import { printProject } from '../project.pipes';
import { bootstrap } from '../../../styles';
import { persoonService } from '../../personen/persoon.service';
import { router } from '../../router';
import './opstapplaatsen-kiezen.component';
import './routes-selecteren.component';

const ACTIVE_STATUSSEN = Object.freeze(['Bevestigd', 'Aangemeld']);
type VervoerstoerStep = 'opstapplaatsen-kiezen' | 'routes-selecteren';

@customElement('rock-vervoerstoer')
export class VervoerstoerComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  projectIds: number[] = [];

  @property({ type: Boolean })
  enkelVakanties = false;

  @property()
  type: ProjectType = 'cursus';

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

  @state()
  begeleiders: OverigPersoon[] = [];

  aanmeldingenPerDeelnemerId: Map<number, Aanmelding[]> = new Map();

  get step2Enabled(): boolean {
    return (
      this.aanmeldingen?.every((aanmelding) =>
        Boolean(aanmelding.opstapplaats),
      ) ?? false
    );
  }

  protected override update(
    changedProperties: PropertyValues<VervoerstoerComponent>,
  ): void {
    if (
      changedProperties.has('projectIds') ||
      changedProperties.has('enkelVakanties') ||
      changedProperties.has('type')
    ) {
      this.#loadProjecten();
    }
    if (
      (changedProperties.has('aanmeldingen') ||
        changedProperties.has('projecten')) &&
      this.aanmeldingen
    ) {
      this.opstapplaatsen = this.aanmeldingen
        .flatMap(
          (aanmelding) => aanmelding.deelnemer?.mogelijkeOpstapplaatsen || [],
        )
        .filter((plaats) => plaats.soort === 'opstapplaats')
        .filter(
          (opstapplaats) =>
            opstapplaats.geschiktVoorVakantie || !this.enkelVakanties,
        )
        .sort((a, b) => a.naam.localeCompare(b.naam));

      const cursussen = this.projecten?.filter(
        (project) => project.type === 'cursus',
      );
      if (cursussen) {
        // Voor deelnemers die rechtstreeks gaan
        this.opstapplaatsen.push(
          ...cursussen
            .flatMap((cursus) => cursus.activiteiten.map((act) => act.locatie))
            .filter(notEmpty),
        );
      }
      this.opstapplaatsen = this.opstapplaatsen.filter(
        (value, index, self) =>
          self.findIndex((val) => val.id === value.id) === index,
      );

      this.deelnemers = this.aanmeldingen
        .map((aanmelding) => aanmelding.deelnemer)
        .filter(notEmpty)
        .filter(
          (value, index, self) =>
            value && self.findIndex((val) => val.id === value.id) === index,
        );
      this.aanmeldingenPerDeelnemerId = new Map();
      for (const aanmelding of this.aanmeldingen) {
        if (aanmelding.deelnemerId) {
          const lijst =
            this.aanmeldingenPerDeelnemerId.get(aanmelding.deelnemerId) || [];
          lijst.push(aanmelding);
          this.aanmeldingenPerDeelnemerId.set(aanmelding.deelnemerId, lijst);
        }
      }
    }
    super.update(changedProperties);
  }

  async #loadProjecten() {
    this.projecten = undefined;
    this.aanmeldingen = undefined;
    [this.projecten, this.aanmeldingen] = await Promise.all([
      projectService.getAll({
        ids: this.projectIds,
        type: this.type,
      }),
      Promise.all(
        this.projectIds.map((id) => projectService.getAanmeldingen(id)),
      ).then((aanmeldingen) =>
        aanmeldingen
          .flat()
          .filter((aanmelding) => ACTIVE_STATUSSEN.includes(aanmelding.status)),
      ),
    ]);
    this.begeleiders = this.projecten
      .flatMap((project) => project.begeleiders)
      .filter(
        (value, index, self) =>
          value && self.findIndex((val) => val.id === value.id) === index,
      );
  }

  @state()
  private isLoading = false;

  async save() {
    if (!this.aanmeldingen) return;
    this.isLoading = true;
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
          ...this.projectIds.map(async (projectId) => {
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
    this.navigateToStep('routes-selecteren');
  }

  private navigateToStep(step: VervoerstoerStep) {
    if (step === 'routes-selecteren' && !this.step2Enabled) {
      return;
    }
    if (!this.routePrefix) {
      return;
    }
    router.navigate(`${this.routePrefix}/${step}`, { keepQuery: true });
  }

  override render() {
    if (!this.projecten || !this.aanmeldingen) {
      return html`<rock-loading></rock-loading>`;
    }
    const activeStep =
      this.step === 'routes-selecteren' && !this.step2Enabled
        ? 'opstapplaatsen-kiezen'
        : this.step;
    if (activeStep !== this.step) {
      this.navigateToStep(activeStep);
    }
    return html`
      <h2>Vervoerstoer maken</h2>
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
            class="nav-link ${activeStep === 'opstapplaatsen-kiezen'
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
      </ul>
      ${activeStep === 'routes-selecteren'
        ? this.renderRoutesSelecteren()
        : this.renderOpstapplaatsenKiezen()}
    `;
  }

  private renderOpstapplaatsenKiezen() {
    return html`<rock-opstapplaatsen-kiezen
      .deelnemers=${this.deelnemers}
      .opstapplaatsen=${this.opstapplaatsen}
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
    return html`<rock-routes-selecteren
      .begeleiders=${this.begeleiders}
      .opstapplaatsen=${this.opstapplaatsen}
      .aanmeldingen=${this.aanmeldingen}
      @begeleiders-changed=${(event: CustomEvent<OverigPersoon[]>) => {
        this.begeleiders = event.detail;
      }}
    ></rock-routes-selecteren>`;
  }
}
