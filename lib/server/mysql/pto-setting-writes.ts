import {
  ptoManualYearsKey,
  ptoUiStateKey,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { stringifyJson } from "./json";
import { dbExecute, type DbExecutor } from "./pool";

export async function upsertPtoSettings(
  state: Pick<PtoPersistenceState, "manualYears" | "uiState">,
  execute: DbExecutor = dbExecute,
) {
  await execute(
    `INSERT INTO pto_settings (setting_key, value)
    VALUES (?, ?), (?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      ptoManualYearsKey,
      stringifyJson(state.manualYears),
      ptoUiStateKey,
      stringifyJson(state.uiState ?? {}),
    ],
  );
}
