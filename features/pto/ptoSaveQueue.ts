type PtoDatabaseWrite<T> = () => Promise<T>;

let ptoDatabaseWriteQueue: Promise<unknown> = Promise.resolve();
let ptoDatabaseWriteRevision = 0;

export function enqueuePtoDatabaseWrite<T>(write: PtoDatabaseWrite<T>) {
  ptoDatabaseWriteRevision += 1;

  const queuedWrite = ptoDatabaseWriteQueue
    .catch(() => undefined)
    .then(write);

  ptoDatabaseWriteQueue = queuedWrite.catch(() => undefined);

  return queuedWrite;
}

export function getPtoDatabaseWriteRevision() {
  return ptoDatabaseWriteRevision;
}
