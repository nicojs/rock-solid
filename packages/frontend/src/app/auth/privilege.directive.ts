import { Privilege, privileges, userRoleNames } from '@rock-solid/shared';
import { PartInfo, PartType, directive } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { Subscription } from 'rxjs';
import { ElementPart, Part, nothing } from 'lit';
import { authStore } from './auth.store';

const validElements = Object.freeze(['BUTTON', 'INPUT']);

class PrivilegeDirective extends AsyncDirective {
  private sub?: Subscription;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        'The `privilege` directive must be used inside a button element',
      );
    }
  }

  override update(part: Part, [privilege]: [Privilege | undefined]): unknown {
    if (!this.sub) {
      if (privilege) {
        const { element } = part as ElementPart;
        if (!validElements.includes(element.tagName)) {
          throw new Error(
            'The `privilege` directive must be used inside a button element',
          );
        }
        const btn = element as HTMLButtonElement | HTMLInputElement;
        this.sub = authStore.user$.subscribe((user) => {
          btn.disabled = !user || !privileges[user.role].includes(privilege);
          if (btn.parentElement) {
            btn.parentElement.title = btn.disabled
              ? `Als ${
                  user?.role ? userRoleNames[user?.role] : 'uitgelogd persoon'
                } mag je deze actie niet uitvoeren.`
              : '';
          }
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
