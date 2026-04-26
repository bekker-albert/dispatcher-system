"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PtoGridViewport = {
  scrollTop: number;
  scrollLeft: number;
  height: number;
  width: number;
};

export function usePtoGridViewport(defaultViewport: Pick<PtoGridViewport, "height" | "width"> = { height: 520, width: 900 }) {
  const [viewport, setViewport] = useState<PtoGridViewport>({
    scrollTop: 0,
    scrollLeft: 0,
    height: defaultViewport.height,
    width: defaultViewport.width,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const updateViewport = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const next = {
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft,
      height: element.clientHeight || defaultViewport.height,
      width: element.clientWidth || defaultViewport.width,
    };

    setViewport((current) => (
      current.scrollTop === next.scrollTop
      && current.scrollLeft === next.scrollLeft
      && current.height === next.height
      && current.width === next.width
        ? current
        : next
    ));
  }, [defaultViewport.height, defaultViewport.width]);

  const scheduleViewportUpdate = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateViewport();
    });
  }, [updateViewport]);

  useEffect(() => {
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [updateViewport]);

  return {
    scrollRef,
    viewport,
    updateViewport,
    scheduleViewportUpdate,
  };
}
