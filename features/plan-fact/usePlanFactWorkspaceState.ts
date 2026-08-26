"use client";

import { useState } from "react";

export function usePlanFactWorkspaceState() {
  const [planFactEditing, setPlanFactEditing] = useState(false);

  return {
    planFactEditing,
    setPlanFactEditing,
  };
}
