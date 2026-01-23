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

export function fromCsv<T extends readonly string[]>(
  headers: T,
  csv: string, // The excel csv delimiter is the opposite of the decimal separator, see https://www.ablebits.com/office-addins-blog/change-excel-csv-delimiter/
  delimiter = decimalSeparator() === ',' ? ';' : ',',
): Record<T[number], string>[] {
  const rows = csv.trim().split('\n');
  const result: Record<string, string>[] = [];

  if (rows.length === 0) {
    return result;
  }

  // Parse the first row to get the actual CSV headers
  const csvHeaders = parseRow(rows[0]!, delimiter);

  // Create a mapping from expected headers to their indices in the CSV
  const headerIndices = new Map<string, number>();
  csvHeaders.forEach((csvHeader, index) => {
    headerIndices.set(csvHeader, index);
  });

  // Process data rows (skip the header row)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const values = parseRow(row, delimiter);

    const record: any = {};
    headers.forEach((header) => {
      const index = headerIndices.get(header);
      if (index === undefined) {
        throw new Error(`Missing header ${header}`);
      }
      record[header] = values[index];
    });
    result.push(record);
  }
  return result;
}

function parseRow(row: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let j = 0; j < row.length; j++) {
    const char = row[j];

    if (char === '"') {
      if (insideQuotes && row[j + 1] === '"') {
        currentValue += '"';
        j++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);

  return values;
}

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
    if (val === undefined || val === null) {
      return '';
    }
    if (typeof val === 'object' || typeof val === 'function') {
      throw new Error(
        `Csv of ${typeof val} is not supported. Requested ${column}: ${String(val)}`,
      );
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
