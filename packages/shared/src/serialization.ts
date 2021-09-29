const dateWhitelist = Object.freeze(['van', 'tot', 'geboortedatum']);
const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(:?\.\d+)?Z$/;
export function keiReviver(key: string, value: unknown): unknown {
  if (
    dateWhitelist.includes(key) &&
    typeof value === 'string' &&
    dateFormat.test(value)
  ) {
    return new Date(value);
  }

  return value;
}

export function parse<T>(json: string) {
  return JSON.parse(json, keiReviver) as T;
}
