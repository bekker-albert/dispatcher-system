import type { AppPtoDateEditing } from "@/features/app/appPtoScreenPropsTypes";

const noop = () => undefined;

export const noopPtoDateEditing: AppPtoDateEditing = {
  addLinkedPtoDateRow: () => "",
  addPtoYear: noop,
  beginPtoRowTextDraft: noop,
  cancelPtoRowTextDraft: noop,
  clearPtoCarryoverOverride: noop,
  commitPtoRowTextDraft: noop,
  deletePtoYear: noop,
  getPtoDropPosition: () => "after",
  getPtoRowTextDraft: () => "",
  moveLinkedPtoDateRow: noop,
  removeLinkedPtoDateRow: noop,
  updatePtoDateDay: noop,
  updatePtoDateRow: noop,
  updatePtoMonthTotal: noop,
  updatePtoRowTextDraft: noop,
};
