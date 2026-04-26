"use client";

import type { CSSProperties } from "react";

import { SectionCard } from "../../shared/ui/layout";

type PtoDatabaseGateProps = {
  message: string;
};

export function PtoDatabaseGate({ message }: PtoDatabaseGateProps) {
  return (
    <SectionCard title="">
      <div style={blockStyle}>{message}</div>
    </SectionCard>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
