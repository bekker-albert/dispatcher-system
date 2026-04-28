export function normalizeTableHeader(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/g, "");
}

export function findTableColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeTableHeader);

  return headers.findIndex((header) => normalizedAliases.includes(normalizeTableHeader(header)));
}
