"use client";

type PtoDatabaseLoadMetricsOptions = {
  includeBuckets: boolean;
  year: string;
};

const slowPtoDatabaseLoadStepMs = 300;

function nowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function roundMs(value: number) {
  return Math.round(value);
}

export function createPtoDatabaseLoadMetrics({
  includeBuckets,
  year,
}: PtoDatabaseLoadMetricsOptions) {
  const startedAt = nowMs();
  let previousMark = startedAt;

  const mark = (step: string, details: Record<string, unknown> = {}) => {
    const currentMark = nowMs();
    const stepMs = currentMark - previousMark;
    previousMark = currentMark;

    if (stepMs < slowPtoDatabaseLoadStepMs) return;

    console.info("[PTO database load]", {
      step,
      stepMs: roundMs(stepMs),
      totalMs: roundMs(currentMark - startedAt),
      year,
      includeBuckets,
      ...details,
    });
  };

  return {
    mark,
    finish(details: Record<string, unknown> = {}) {
      const finishedAt = nowMs();
      console.info("[PTO database load]", {
        step: "finished",
        totalMs: roundMs(finishedAt - startedAt),
        year,
        includeBuckets,
        ...details,
      });
    },
  };
}
