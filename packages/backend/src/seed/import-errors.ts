interface ImportError<T> {
  item: T;
  detail: string;
}

export class ImportErrors<T> {
  errorsByCategory = new Map<string, ImportError<T>[]>();
  warningsByCategory = new Map<string, ImportError<T>[]>();
  addError(category: string, error: ImportError<T>) {
    const errors = this.errorsByCategory.get(category) ?? [];
    this.errorsByCategory.set(category, errors);
    errors.push(error);
  }
  addWarning(category: string, warning: ImportError<T>) {
    const warnings = this.warningsByCategory.get(category) ?? [];
    this.warningsByCategory.set(category, warnings);
    warnings.push(warning);
  }

  get errorLength() {
    return [...this.errorsByCategory.entries()].reduce(
      (acc, [, errors]) => errors.length + acc,
      0,
    );
  }
  get warningLength() {
    return [...this.warningsByCategory.entries()].reduce(
      (acc, [, warnings]) => warnings.length + acc,
      0,
    );
  }
  get report() {
    return `${this.errorLength} errors, ${this.warningLength} warnings`;
  }

  toJSON() {
    return {
      errors: Object.fromEntries(this.errorsByCategory.entries()),
      warnings: Object.fromEntries(this.warningsByCategory.entries()),
    };
  }
}

export function notEmpty<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}
