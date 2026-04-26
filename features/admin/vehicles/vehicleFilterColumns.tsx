import { Eye } from "lucide-react";

import { vehicleFilterColumnConfigs } from "../../../lib/domain/vehicles/grid";

export const vehicleFilterColumns = vehicleFilterColumnConfigs.map((column) => (
  column.key === "visible" ? { ...column, icon: <Eye size={14} aria-hidden /> } : column
));
