interface ImportError<T> {
  item: T;
  detail: string;
}

export class ImportErrors<T> {
  errorsByCategory = new Map<string, ImportError<T>[]>();
  private _length = 0;
  add(category: string, error: ImportError<T>) {
    const errors = this.errorsByCategory.get(category) ?? [];
    this.errorsByCategory.set(category, errors);
    errors.push(error);
    this._length++;
  }

  get length() {
    return this._length;
  }

  toJSON() {
    return Object.fromEntries(this.errorsByCategory.entries());
  }
}

export function notEmpty<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}
