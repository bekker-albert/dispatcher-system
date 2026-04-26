"use client";

import { useState } from "react";
import { databaseConfigured } from "@/lib/data/config";

export function usePtoDatabaseUiState() {
  const [ptoDatabaseMessage, setPtoDatabaseMessage] = useState(
    databaseConfigured ? "База данных подключается..." : "База данных не настроена.",
  );
  const [ptoDatabaseReady, setPtoDatabaseReady] = useState(!databaseConfigured);
  const [ptoSaveRevision, setPtoSaveRevision] = useState(0);

  return {
    ptoDatabaseMessage,
    setPtoDatabaseMessage,
    ptoDatabaseReady,
    setPtoDatabaseReady,
    ptoSaveRevision,
    setPtoSaveRevision,
  };
}
