export function show(value: unknown) {
  if (value === undefined || value === null) {
    return 'N/A';
  } else {
    return value;
  }
}
