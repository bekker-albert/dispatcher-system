import { createDefaultSubTabs } from "@/lib/domain/navigation/tabs";
import { defaultContractors } from "@/lib/domain/reference/defaults";
import { createDefaultVehicles } from "@/lib/domain/vehicles/defaults";

export const defaultVehicles = createDefaultVehicles([]);
export const defaultSubTabs = createDefaultSubTabs(Object.keys(defaultContractors));
