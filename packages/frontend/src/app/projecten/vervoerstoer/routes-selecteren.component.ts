import { Aanmelding, Locatie, OverigPersoon } from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tagsControl } from '../../forms';
import { formStyles } from '../../forms/reactive-form.component';
import { showLocatie } from '../../locaties/locatie.pipe';
import { persoonService } from '../../personen/persoon.service';
import { fullName } from '../../personen/persoon.pipe';
import { RockElement } from '../../rock-element';
import { bootstrap } from '../../../styles';

@customElement('rock-routes-selecteren')
export class RoutesSelecterenComponent extends RockElement {
	static override styles = [bootstrap, formStyles];

	@property({ attribute: false })
	begeleiders: OverigPersoon[] = [];

	@property({ attribute: false })
	opstapplaatsen: Locatie[] = [];

	@property({ attribute: false })
	aanmeldingen: Aanmelding[] = [];

	protected override update(
		changedProperties: PropertyValues<RoutesSelecterenComponent>,
	): void {
		if (changedProperties.has('begeleiders')) {
			this.dispatchEvent(
				new CustomEvent<OverigPersoon[]>('begeleiders-changed', {
					detail: this.begeleiders,
					bubbles: true,
					composed: true,
				}),
			);
		}
		super.update(changedProperties);
	}

	override render() {
		return html`<div class="row mb-3 z-index-9999">
				<div class="col mb-3">
					<rock-reactive-form-tags
						.entity=${this}
						.control=${tagsControl<RoutesSelecterenComponent, 'begeleiders'>(
							'begeleiders',
							(begeleider) => fullName(begeleider),
							async (text) => {
								const begeleiders = (await persoonService.getAll({
									type: 'overigPersoon',
									selectie: ['personeel'],
									volledigeNaamLike: text,
								})) as OverigPersoon[];
								return begeleiders.map((begeleider) => ({
									text: fullName(begeleider),
									value: begeleider,
								}));
							},
							{ label: 'Begeleiders', minCharacters: 0 },
						)}
					>
					</rock-reactive-form-tags>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-6 col-md-4 col-xxl-2">
					<h4>Toe te kennen</h4>
					<ul class="list-group">
						${this.opstapplaatsen
							.filter(
								(plaats) =>
									!this.aanmeldingen.some(
										(aanmelding) => aanmelding.opstapplaats?.id === plaats.id,
									),
							)
							.map(
								(plaats) =>
									html`<li class="list-group-item">
										<rock-icon icon="gripHorizontal"></rock-icon> ${showLocatie(
											plaats,
										)}
									</li>`,
							)}
					</ul>
				</div>
				<div class="col">
					${this.begeleiders.map(
						(begeleider) =>
							html`<div class="row mb-3">
								<h4>${fullName(begeleider)}</h4>
								<div class="col drag-landing-place"></div>
							</div>`,
					)}
				</div>
			</div>`;
	}
}
