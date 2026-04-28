export type XlsxColumnOption = {
  width?: number;
  hidden?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
};

export type XlsxExportOptions = {
  columns?: XlsxColumnOption[];
  outlineSummaryRight?: boolean;
};

export type XlsxCellValue = string | number | boolean | null | undefined;
