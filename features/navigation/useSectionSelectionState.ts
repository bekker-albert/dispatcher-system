"use client";

import { useState } from "react";
import type { AdminSection, StructureSection } from "@/lib/domain/admin/navigation";

export function useSectionSelectionState() {
  const [dispatchTab, setDispatchTab] = useState("daily");
  const [contractorTab, setContractorTab] = useState("AA Mining");
  const [fuelTab, setFuelTab] = useState("general");
  const [ptoTab, setPtoTab] = useState("bodies");
  const [tbTab, setTbTab] = useState("list");
  const [structureSection, setStructureSection] = useState<StructureSection>("scheme");
  const [adminSection, setAdminSection] = useState<AdminSection>("vehicles");

  return {
    dispatchTab,
    setDispatchTab,
    contractorTab,
    setContractorTab,
    fuelTab,
    setFuelTab,
    ptoTab,
    setPtoTab,
    tbTab,
    setTbTab,
    structureSection,
    setStructureSection,
    adminSection,
    setAdminSection,
  };
}
