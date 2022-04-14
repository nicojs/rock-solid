import { PAGE_SIZE } from '@rock-solid/shared';

interface Page {
  skip?: number;
  take?: number;
}

const noPaging: Readonly<Page> = Object.freeze({});

export function toPage(n: number | undefined): Page {
  if (n === undefined) {
    return noPaging;
  } else {
    return { skip: n * PAGE_SIZE, take: PAGE_SIZE };
  }
}
