export function toQueryString(query: object | undefined) {
  if (query) {
    const entries = Object.entries(query);
    if (entries.length) {
      return `?${entries
        .filter(
          ([, val]) =>
            val !== undefined &&
            val !== '' &&
            val !== false &&
            (!Array.isArray(val) || val.length > 0),
        )
        .map(
          ([key, val]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`,
        )
        .join('&')}`;
    }
  }
  return '';
}
