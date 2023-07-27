export function toQueryString(query: object | undefined) {
  if (query) {
    return `?${Object.entries(query)
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
  return '';
}
