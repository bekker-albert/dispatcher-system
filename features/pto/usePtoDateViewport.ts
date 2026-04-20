import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";

export type PtoDateViewport = {
  top: number;
  height: number;
};

type UsePtoDateViewportOptions = {
  active: boolean;
  resetKey: string;
  measureKey: string;
};

export function usePtoDateViewport({ active, resetKey, measureKey }: UsePtoDateViewportOptions) {
  const [viewport, setViewport] = useState<PtoDateViewport>({ top: 0, height: 640 });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const updateViewportFromElement = useCallback((element: HTMLDivElement, threshold = 2) => {
    const nextTop = element.scrollTop;
    const nextHeight = element.clientHeight || 640;

    setViewport((current) => (
      Math.abs(current.top - nextTop) < threshold && Math.abs(current.height - nextHeight) < 2
        ? current
        : { top: nextTop, height: nextHeight }
    ));
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateViewportFromElement(element, 12);
    });
  }, [updateViewportFromElement]);

  useEffect(() => {
    if (!active) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (element) element.scrollTop = 0;
      setViewport((current) => (current.top === 0 ? current : { ...current, top: 0 }));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active, resetKey]);

  useEffect(() => {
    if (!active) return undefined;

    const measureViewport = () => {
      const element = scrollRef.current;
      if (!element) return;
      updateViewportFromElement(element);
    };

    const frame = window.requestAnimationFrame(measureViewport);
    window.addEventListener("resize", measureViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureViewport);
    };
  }, [active, measureKey, updateViewportFromElement]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
  }, []);

  return {
    viewport,
    scrollRef,
    updateViewportFromElement,
    handleScroll,
  };
}
