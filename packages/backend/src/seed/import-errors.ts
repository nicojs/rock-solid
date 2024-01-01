interface ImportDiagnostic<T> {
  item: T;
  detail: string;
}

export class ImportDiagnostics<T> {
  errorsByCategory = new Map<string, ImportDiagnostic<T>[]>();
  warningsByCategory = new Map<string, ImportDiagnostic<T>[]>();
  infosByCategory = new Map<string, ImportDiagnostic<T>[]>();
  addError(category: string, error: ImportDiagnostic<T>) {
    const errors = this.errorsByCategory.get(category) ?? [];
    this.errorsByCategory.set(category, errors);
    errors.push(error);
  }
  addWarning(category: string, warning: ImportDiagnostic<T>) {
    const warnings = this.warningsByCategory.get(category) ?? [];
    this.warningsByCategory.set(category, warnings);
    warnings.push(warning);
  }
  addInfo(category: string, info: ImportDiagnostic<T>) {
    const infos = this.infosByCategory.get(category) ?? [];
    this.infosByCategory.set(category, infos);
    infos.push(info);
  }

  get errorLength() {
    return this.lengthOf(this.errorsByCategory);
  }
  get warningLength() {
    return this.lengthOf(this.warningsByCategory);
  }
  get infoLength() {
    return this.lengthOf(this.infosByCategory);
  }
  private lengthOf(category: Map<string, ImportDiagnostic<T>[]>) {
    return [...category.entries()].reduce(
      (acc, [, items]) => items.length + acc,
      0,
    );
  }
  get report() {
    return `${this.errorLength} errors, ${this.warningLength} warnings, ${this.infoLength} infos`;
  }

  toJSON() {
    return {
      errors: Object.fromEntries(this.errorsByCategory.entries()),
      warnings: Object.fromEntries(this.warningsByCategory.entries()),
      infos: Object.fromEntries(this.infosByCategory.entries()),
    };
  }
}

export function notEmpty<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}
