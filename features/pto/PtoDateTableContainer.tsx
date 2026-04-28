"use client";

import dynamic from "next/dynamic";
import { PtoDateReadonlyTableContainer } from "@/features/pto/PtoDateReadonlyTableContainer";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";

const PtoDateEditableTableContainer = dynamic(
  () => import("@/features/pto/PtoDateEditableTableContainer")
    .then((module) => module.PtoDateEditableTableContainer),
  { ssr: false },
);

export function PtoDateTableContainer(props: PtoDateTableContainerProps) {
  if (!props.ptoDateEditing) {
    return <PtoDateReadonlyTableContainer {...props} />;
  }

  return <PtoDateEditableTableContainer {...props} />;
}
