import { useCallback, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  type PtoDateTableKey,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { ptoDateExportFileName, ptoDateTableMeta, type PtoDateExcelMeta } from "@/lib/domain/pto/excel-meta";
import { uniqueSorted } from "@/lib/utils/text";

type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

export type PtoDateExcelMetaWithRows = PtoDateExcelMeta & {
  rows: PtoPlanRow[];
};

type UsePtoDateExcelTransferOptions = {
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  importInputRef: RefObject<HTMLInputElement | null>;
  setPtoPlanRows: PtoRowsSetter;
  setPtoOperRows: PtoRowsSetter;
  setPtoSurveyRows: PtoRowsSetter;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  requestSave: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function usePtoDateExcelTransfer({
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  importInputRef,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  setPtoManualYears,
  setExpandedPtoMonths,
  requestSave,
  addAdminLog,
}: UsePtoDateExcelTransferOptions) {
  const openPtoDateImportFilePicker = useCallback(() => {
    importInputRef.current?.click();
  }, [importInputRef]);

  const currentPtoDateExcelMeta = useCallback((tab = ptoTab): PtoDateExcelMetaWithRows => {
    const meta = ptoDateTableMeta(tab);
    const rowsByTable: Record<PtoDateTableKey, PtoPlanRow[]> = {
      plan: ptoPlanRows,
      oper: ptoOperRows,
      survey: ptoSurveyRows,
    };

    return { ...meta, rows: rowsByTable[meta.table] };
  }, [ptoOperRows, ptoPlanRows, ptoSurveyRows, ptoTab]);

  const exportPtoDateTableToExcel = useCallback(async () => {
    const meta = currentPtoDateExcelMeta();
    try {
      const [
        { createPtoPlanExportColumns, createPtoPlanExportRows },
        { createXlsxBlob },
      ] = await Promise.all([
        import("@/lib/domain/pto/excel-export"),
        import("@/lib/utils/xlsx-export"),
      ]);
      const rows = createPtoPlanExportRows(meta.rows, ptoPlanYear, ptoAreaFilter, meta.table);
      const fileName = ptoDateExportFileName(meta, ptoPlanYear, ptoAreaFilter);
      const blob = createXlsxBlob(rows, meta.label, {
        columns: createPtoPlanExportColumns(ptoPlanYear, meta.table),
        outlineSummaryRight: false,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      addAdminLog({
      action: "Выгрузка",
      section: meta.section,
      details: `Выгружена таблица "${meta.label}" за ${ptoPlanYear} год: ${Math.max(0, rows.length - 1)} строк.`,
      fileName,
      rowsCount: Math.max(0, rows.length - 1),
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `Не удалось выгрузить Excel-файл таблицы "${meta.label}".`);
    }
  }, [addAdminLog, currentPtoDateExcelMeta, ptoAreaFilter, ptoPlanYear]);

  const importPtoDateTableFromExcel = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const meta = currentPtoDateExcelMeta();

    try {
      const [
        { createPtoPlanRowsFromImportTable, ensureImportedRowsInLinkedPtoTable, mergeImportedPtoPlanRows },
        { parseTableImportFile },
      ] = await Promise.all([
        import("@/lib/domain/pto/excel-import"),
        import("@/lib/utils/xlsx-import"),
      ]);
      const importedRows = createPtoPlanRowsFromImportTable(await parseTableImportFile(file), ptoPlanYear, meta.rows, meta.table);
      if (!importedRows.length) {
        window.alert(`В выбранном файле не найдены строки таблицы "${meta.label}".`);
        return;
      }

      if (!window.confirm(`Загрузить таблицу "${meta.label}" из файла? Будет обновлено или добавлено строк: ${importedRows.length}.`)) return;

      const firstImportedMonth = importedRows
        .flatMap((row) => Object.keys(row.dailyPlans))
        .filter((date) => date.startsWith(`${ptoPlanYear}-`))
        .sort()[0]?.slice(0, 7) ?? `${ptoPlanYear}-01`;

      if (meta.table === "oper") {
        setPtoOperRows((current) => mergeImportedPtoPlanRows(current, importedRows));
        setPtoPlanRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
        setPtoSurveyRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      } else if (meta.table === "survey") {
        setPtoSurveyRows((current) => mergeImportedPtoPlanRows(current, importedRows));
        setPtoPlanRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
        setPtoOperRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      } else {
        setPtoPlanRows((current) => mergeImportedPtoPlanRows(current, importedRows, { includeCustomerCode: true }));
        setPtoOperRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
        setPtoSurveyRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      }
      setPtoManualYears((current) => uniqueSorted([...current, ptoPlanYear]));
      setExpandedPtoMonths((current) => ({ ...current, [firstImportedMonth]: true }));
      requestSave();
      addAdminLog({
        action: "Загрузка",
        section: meta.section,
        details: `Загружена таблица "${meta.label}" за ${ptoPlanYear} год: ${importedRows.length} строк.`,
        fileName: file.name,
        rowsCount: importedRows.length,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `Не удалось прочитать Excel-файл таблицы "${meta.label}".`);
    }
  }, [
    addAdminLog,
    currentPtoDateExcelMeta,
    ptoPlanYear,
    requestSave,
    setExpandedPtoMonths,
    setPtoOperRows,
    setPtoManualYears,
    setPtoPlanRows,
    setPtoSurveyRows,
  ]);

  return {
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
  };
}
