import { noChange } from 'lit';
import {
  Directive,
  directive,
  ElementPart,
  Part,
  PartInfo,
  PartType,
} from 'lit/directive.js';
import { router } from '../router';

class RouterLink extends Directive {
  private currentElement?: Element;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        'The `routerLink` directive must be used inside an anchor or button element',
      );
    }
  }
  override update(part: Part, [href]: string[]): unknown {
    const { element } = part as ElementPart;
    if (router.isActive(href!)) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
    if (this.currentElement === element) {
      return noChange;
    }
    if (this.currentElement) {
      this.currentElement.removeEventListener('click', this.navigationClicked);
    }
    this.currentElement = element;

    element.setAttribute('href', href!);
    element.addEventListener('click', this.navigationClicked);

    return noChange;
  }

  render(href: string): string {
    return href;
  }

  private navigationClicked = (ev: Event) => {
    ev.preventDefault();
    if (this.currentElement && this.currentElement.hasAttribute('href')) {
      router.navigate(this.currentElement.getAttribute('href')!);
    }
  };
}

export const routerLink = directive(RouterLink);
