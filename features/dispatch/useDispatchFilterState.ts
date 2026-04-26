"use client";

import { useState } from "react";

export function useDispatchFilterState() {
  const [areaFilter, setAreaFilter] = useState("Все участки");
  const [search, setSearch] = useState("");

  return {
    areaFilter,
    setAreaFilter,
    search,
    setSearch,
  };
}
