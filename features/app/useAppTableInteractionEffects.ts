"use client";

import { useTableResizeHandlers } from "@/components/shared/useTableResizeHandlers";
import { useGlobalCellSelectionEffects } from "@/features/app/useGlobalCellSelectionEffects";
import { usePtoPendingFieldFocus } from "@/features/pto/usePtoPendingFieldFocus";

type UseAppTableInteractionEffectsOptions =
  Parameters<typeof useTableResizeHandlers>[0]
  & Parameters<typeof useGlobalCellSelectionEffects>[0]
  & Parameters<typeof usePtoPendingFieldFocus>[0];

export function useAppTableInteractionEffects(options: UseAppTableInteractionEffectsOptions) {
  const resizeHandlers = useTableResizeHandlers(options);

  useGlobalCellSelectionEffects(options);
  usePtoPendingFieldFocus(options);

  return resizeHandlers;
}
