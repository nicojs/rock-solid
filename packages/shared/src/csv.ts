import {
  Labels,
  capitalize,
  decimalSeparator,
  showBoolean,
  showDatum,
} from './util.js';

export type ValueFactory<T> = {
  [Prop in keyof T]?: (val: T[Prop]) => string;
};

export function toCsv<T>(
  values: T[],
  columns: ReadonlyArray<keyof T & string>,
  columnLabels: Partial<Labels<T>> = {},
  valueFactory: ValueFactory<T> = {},
  // The excel csv delimiter is the opposite of the decimal separator, see https://www.ablebits.com/office-addins-blog/change-excel-csv-delimiter/
  delimiter = decimalSeparator() === ',' ? ';' : ',',
): string {
  let csv = columns
    .map((column) => columnLabels[column] ?? capitalize(column))
    .map(escape)
    .join(delimiter);
  csv += '\n';

  csv += values
    .map((row) => columns.map((column) => toValue(row, column)).join(delimiter))
    .join('\n');
  return csv;

  function toValue(row: T, column: keyof T & string) {
    const val = row[column];
    return escape(mapValue(column, val));
  }

  function mapValue(column: keyof T & string, val: T[keyof T & string]) {
    const factory = valueFactory[column];
    if (factory) {
      return factory(val);
    }
    if (typeof val === 'boolean') {
      return showBoolean(val);
    }
    if (val instanceof Date) {
      return showDatum(val);
    }
    if (typeof val === 'object' || typeof val === 'function') {
      throw new Error(
        `Csv of ${typeof val} is not supported. Requested ${column}: ${String(val)}`,
      );
    }

    if (val === undefined || val === null) {
      return '';
    }
    return String(val);
  }

  function escape(str: string) {
    if (str.includes(delimiter) || str.includes('"') || str.includes("'")) {
      return `"${str.replace(/"/, '""')}"`;
    }
    return str;
  }
}
