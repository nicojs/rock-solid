import Decimal from 'decimal.js';

const dateWhitelist = Object.freeze([
  'van',
  'tot',
  'totEnMet',
  'geboortedatum',
  'tijdstipVanInschrijving',
  'tijdstipVanBevestiging',
  'tijdstipVerzendenVervoersbrief',
]);

const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(:?\.\d+)?Z$/;
const decimalWhitelist = Object.freeze(['prijs', 'voorschot']);

export function rockReviver(key: string, value: unknown): unknown {
  if (
    dateWhitelist.includes(key) &&
    typeof value === 'string' &&
    dateFormat.test(value)
  ) {
    return new Date(value);
  }
  if (decimalWhitelist.includes(key) && typeof value === 'string') {
    return new Decimal(value);
  }

  return value;
}

export function parse<T>(json: string) {
  return JSON.parse(json, rockReviver) as T;
}
