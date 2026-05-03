function clientSnapshotValueHash(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function clientSnapshotStorageSignature(clientId: string, storage: Record<string, string>) {
  return Object.entries(storage)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}:${value.length}:${clientSnapshotValueHash(value)}`)
    .join("|")
    .concat(`|client:${clientId}`);
}
