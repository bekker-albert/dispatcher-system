import { isDatabaseConflictError } from "@/lib/data/errors";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import { enqueuePtoDatabaseWrite } from "@/features/pto/ptoSaveQueue";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type PtoInlineDatabaseWriteOptions<T> = {
  label: string;
  showSaveStatus: ShowSaveStatus;
  write: () => Promise<T>;
  onSaved: (result: T) => void;
};

function inlineWriteErrorMessage(label: string, error: unknown) {
  if (isDatabaseConflictError(error)) {
    return `ПТО не сохранено (${label}): данные на сервере изменились другим пользователем. Обнови страницу перед повторным сохранением.`;
  }

  return `ПТО не сохранено (${label}): ${errorToMessage(error)}`;
}

export function enqueuePtoInlineDatabaseWrite<T>({
  label,
  showSaveStatus,
  write,
  onSaved,
}: PtoInlineDatabaseWriteOptions<T>) {
  void enqueuePtoDatabaseWrite(write)
    .then(onSaved)
    .catch((error) => {
      showSaveStatus("error", inlineWriteErrorMessage(label, error));
      console.warn(`Database PTO inline write failed (${label}):`, error);
    });
}
