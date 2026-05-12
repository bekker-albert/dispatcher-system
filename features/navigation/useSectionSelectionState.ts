"use client";

import { useState } from "react";
import type { AdminSection, StructureSection } from "@/lib/domain/admin/navigation";
import type { DispatchDailyReportTab } from "@/lib/domain/dispatch/summary";

export function useSectionSelectionState() {
  const [dispatchTab, setDispatchTab] = useState("daily");
  const [dispatchDailyReportTab, setDispatchDailyReportTab] = useState<DispatchDailyReportTab>("volumes");
  const [contractorTab, setContractorTab] = useState("AA Mining");
  const [fuelTab, setFuelTab] = useState("general");
  const [fleetTab, setFleetTab] = useState("directory");
  const [ptoTab, setPtoTab] = useState("bodies");
  const [tbTab, setTbTab] = useState("list");
  const [structureSection, setStructureSection] = useState<StructureSection>("scheme");
  const [adminSection, setAdminSection] = useState<AdminSection>("vehicles");

  return {
    dispatchTab,
    setDispatchTab,
    dispatchDailyReportTab,
    setDispatchDailyReportTab,
    contractorTab,
    setContractorTab,
    fuelTab,
    setFuelTab,
    fleetTab,
    setFleetTab,
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
