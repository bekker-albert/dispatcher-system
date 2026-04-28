import type { ComponentProps, ReactNode } from "react";

import type { PtoDateEditableTable } from "@/features/pto/PtoDateEditableTable";
import type { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import type { PtoDateRowsColumnsModel } from "@/features/pto/ptoDateRowsColumnsModel";
import type { PtoDateReadonlyTableProps, PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import type { usePtoDateHeaderRenderers } from "@/features/pto/usePtoDateHeaderRenderers";
import type { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";

export type PtoDateEditableProps = Omit<ComponentProps<typeof PtoDateEditableTable>, "formulaBar">;
export type PtoDateReadonlyProps = PtoDateReadonlyTableProps;

export type CreatePtoDateReadonlyPropsModelOptions = {
  props: PtoDateTableContainerProps;
  toolbar: ReactNode;
  rowsColumnsModel: PtoDateRowsColumnsModel;
};

export type CreatePtoDateEditablePropsModelOptions = CreatePtoDateReadonlyPropsModelOptions & {
  draftRowController: ReturnType<typeof usePtoDraftRowController>;
  formulaController: ReturnType<typeof usePtoDateFormulaController>;
  headerRenderers: ReturnType<typeof usePtoDateHeaderRenderers>;
};
