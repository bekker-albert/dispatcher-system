"use client";

import { useEffect, useRef } from "react";
import { runInitialAppDataLoad, type InitialAppDataLoadOptions } from "@/features/app/initialAppDataLoadSteps";

export function useInitialAppDataLoad(options: InitialAppDataLoadOptions) {
  const loadStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || loadStartedRef.current) return;
      loadStartedRef.current = true;

      void runInitialAppDataLoad({
        ...options,
        isCancelled: () => cancelled,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    options,
  ]);
}
