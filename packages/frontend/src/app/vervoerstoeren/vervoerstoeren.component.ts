import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  Vervoerstoer,
  VervoerstoerFilter,
  toVervoerstoerFilter,
  tryParseInt,
  Queryfied,
} from '@rock-solid/shared';
import { vervoerstoerenStore } from './vervoerstoeren.store';
import { PropertyValues, html } from 'lit';
import { router } from '../router';
import { vervoerstoerService } from './vervoerstoer.service';
import { toQuery } from '../shared';
import { InputControl, InputType } from '../forms';

type VervoerstoerStep =
  | 'opstapplaatsen-kiezen'
  | 'routes-selecteren'
  | 'tijdsplanning';

const mainSearchControl: InputControl<VervoerstoerFilter> = {
  type: InputType.text,
  name: 'naamLike',
  label: 'Projectnaam',
  placeholder: 'Zoek op projectnaam',
};

const advancedSearchControls: InputControl<VervoerstoerFilter>[] = [
  {
    type: InputType.text,
    name: 'bestemmingLike',
    label: 'Bestemming',
    placeholder: 'Zoek op bestemming',
  },
  {
    type: InputType.text,
    name: 'aangemaaktDoorLike',
    label: 'Aangemaakt door',
    placeholder: 'Zoek op naam',
  },
];

@customElement('rock-vervoerstoeren')
export class VervoerstoerenComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false })
  public query?: Queryfied<VervoerstoerFilter> & { page: string };

  @state()
  private vervoerstoeren?: Vervoerstoer[];

  @state()
  private editVervoerstoer?: Vervoerstoer;

  @state()
  private filter: VervoerstoerFilter = {};

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      vervoerstoerenStore.currentPageItem$.subscribe(
        (vervoerstoeren) => (this.vervoerstoeren = vervoerstoeren),
      ),
    );
  }

  override update(props: PropertyValues<VervoerstoerenComponent>): void {
    if (props.has('path')) {
      const oldPath = props.get('path');
      const newId = this.path[0] === 'edit' ? this.path[1] : undefined;
      const oldId = oldPath?.[0] === 'edit' ? oldPath[1] : undefined;
      if (newId && newId !== oldId) {
        this.#loadVervoerstoer(+newId);
      } else if (!newId) {
        this.editVervoerstoer = undefined;
      }
    }
    if (
      (props.has('query') || props.has('path')) &&
      this.query &&
      !this.path.length
    ) {
      const { page, ...filterParams } = this.query;
      this.filter = toVervoerstoerFilter(filterParams);
      const currentPage = (tryParseInt(page) ?? 1) - 1;
      vervoerstoerenStore.setCurrentPage(currentPage, { ...this.filter });
    }
    super.update(props);
  }

  async #loadVervoerstoer(id: number) {
    this.editVervoerstoer = undefined;
    this.editVervoerstoer = await vervoerstoerService.get(id);
  }

  private deleteVervoerstoer(ev: CustomEvent<Vervoerstoer>) {
    vervoerstoerenStore.delete(ev.detail.id).subscribe();
  }

  override render() {
    switch (this.path[0]) {
      case undefined:
        return html`
          <div class="row">
            <h2 class="col">Vervoerstoeren</h2>
          </div>
          <rock-search
            .mainControl=${mainSearchControl}
            .advancedControls=${advancedSearchControls}
            .filter=${this.filter}
            @search-submitted=${() => router.setQuery(toQuery(this.filter))}
          ></rock-search>
          ${this.vervoerstoeren !== undefined
            ? html`
                <rock-vervoerstoeren-list
                  .vervoerstoeren=${this.vervoerstoeren}
                  @delete=${(ev: CustomEvent<Vervoerstoer>) =>
                    this.deleteVervoerstoer(ev)}
                ></rock-vervoerstoeren-list>
                <rock-paging .store=${vervoerstoerenStore}></rock-paging>
              `
            : html`<rock-loading></rock-loading>`}
        `;
      case 'edit': {
        const id = tryParseInt(this.path[1]);
        if (!id) {
          navigateToList();
          return;
        }
        if (!this.editVervoerstoer) {
          return html`<rock-loading></rock-loading>`;
        }
        const step = (this.path[2] ?? 'opstapplaatsen-kiezen') as VervoerstoerStep;
        if (!this.path[2]) {
          router.navigate(`/vervoerstoeren/edit/${id}/opstapplaatsen-kiezen`, {
            keepQuery: true,
          });
          return;
        }
        return html`<rock-vervoerstoer
          .vervoerstoer=${this.editVervoerstoer}
          .routePrefix=${`/vervoerstoeren/edit/${id}`}
          .step=${step}
        ></rock-vervoerstoer>`;
      }
      default:
        navigateToList();
    }
  }
}

function navigateToList() {
  router.navigate('/vervoerstoeren', { keepQuery: true });
}
