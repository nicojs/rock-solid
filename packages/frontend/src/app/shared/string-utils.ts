import { showDatum } from './utility.pipes';

export type ValueFactory<T> = {
  [Prop in keyof T]?: (val: T[Prop]) => string;
};

export function toCsvDownloadUrl<T>(
  values: T[],
  columns: Array<keyof T & string>,
  columnLabels: Record<keyof T, string>,
  valueFactory: ValueFactory<T>,
) {
  const csv = toCsv(values, columns, columnLabels, valueFactory);
  // BOM is needed, see https://stackoverflow.com/questions/18249290/generate-csv-for-excel-via-javascript-with-unicode-characters#answer-48818418
  const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
  const href = URL.createObjectURL(
    new Blob([BOM, csv], { type: 'data:text/csv;charset=utf-8' }),
  );
  return href;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 * @returns the decimal separator in the current language
 */
export function decimalSeparator(): ',' | '.' {
  return new Intl.NumberFormat().format(1.2).substring(1, 2) as ',' | '.';
}

export function toCsv<T>(
  values: T[],
  columns: Array<keyof T & string>,
  columnLabels: Record<keyof T, string>,
  valueFactory: ValueFactory<T>,
): string {
  // The excel csv delimiter is the opposite of the decimal separator, see https://www.ablebits.com/office-addins-blog/change-excel-csv-delimiter/
  const delimiter = decimalSeparator() === ',' ? ';' : ',';

  let csv = columns
    .map((column) => columnLabels[column])
    .map(escape)
    .join(delimiter);
  csv += '\n';

  csv += values
    .map((row) => columns.map((column) => toValue(row, column)).join(delimiter))
    .join('\n');
  return csv;

  function toValue(row: T, column: keyof T) {
    const val = row[column];
    return escape(mapValue(column, val));
  }

  function mapValue(column: keyof T, val: T[keyof T]) {
    const factory = valueFactory[column];
    if (factory) {
      return factory(val);
    }
    if (val instanceof Date) {
      return showDatum(val);
    }
    if (typeof val === 'object' || typeof val === 'function') {
      throw new Error(
        `Csv of ${typeof val} is not supported. Requested ${column}: ${val}`,
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
