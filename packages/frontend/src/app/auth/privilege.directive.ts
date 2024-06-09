import { Privilege, privileges } from '@rock-solid/shared';
import { directive } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { Subscription } from 'rxjs';
import { ElementPart, Part, nothing } from 'lit';
import { authStore } from './auth.store';

const VALID_ELEMENTS = Object.freeze([
  'BUTTON',
  'INPUT',
  'A',
  'ROCK-LINK',
  'TH',
  'TD',
]);
const formatWrongPlacementMessage = (tagName: string) =>
  `The 'privilege' directive must be used inside a button, anchor or input element. Was ${tagName}`;
type ValidPrivilegeElement =
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLAnchorElement;

class PrivilegeDirective extends AsyncDirective {
  private sub?: Subscription;

  override update(part: Part, [privilege]: [Privilege | undefined]): unknown {
    if (!this.sub) {
      if (privilege) {
        const { element } = part as ElementPart;
        if (!VALID_ELEMENTS.includes(element.tagName)) {
          throw new Error(formatWrongPlacementMessage(element.tagName));
        }
        this.sub = authStore.user$.subscribe((user) => {
          (element as ValidPrivilegeElement).hidden =
            !user || !privileges[user.role].includes(privilege);
        });
      }
      return this.render(privilege);
    }
    return nothing;
  }

  override render(privilege: Privilege | undefined): unknown {
    return privilege;
  }

  override disconnected() {
    this.sub?.unsubscribe();
    super.disconnected();
  }
}
export const privilege = directive(PrivilegeDirective);
