import { Privilege, privileges } from '@rock-solid/shared';
import { directive } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { Subscription } from 'rxjs';
import { ElementPart, Part, nothing } from 'lit';
import { authStore } from './auth.store';

class PrivilegeDirective extends AsyncDirective {
  private sub?: Subscription;

  override update(part: Part, [privilege]: [Privilege | undefined]): unknown {
    if (!this.sub) {
      if (privilege) {
        const { element } = part as ElementPart;
        this.sub = authStore.user$.subscribe((user) => {
          (element as HTMLElement).hidden =
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
