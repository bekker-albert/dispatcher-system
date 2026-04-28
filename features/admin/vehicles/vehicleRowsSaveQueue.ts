type VehicleRowsSaveTask = (isLatest: () => boolean) => Promise<void>;

export type VehicleRowsSaveQueue = ReturnType<typeof createVehicleRowsSaveQueue>;

export function createVehicleRowsSaveQueue() {
  let latestRevision = 0;
  let chain = Promise.resolve();

  return {
    enqueue(task: VehicleRowsSaveTask) {
      const revision = latestRevision + 1;
      latestRevision = revision;
      const isLatest = () => revision === latestRevision;

      chain = chain
        .catch(() => undefined)
        .then(async () => {
          if (!isLatest()) return;
          await task(isLatest);
        })
        .catch(() => undefined);
    },
  };
}
