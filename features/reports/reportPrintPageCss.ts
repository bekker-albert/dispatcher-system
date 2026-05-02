import { reportPrintProfile } from "./reportPrintProfile";

export const reportPrintPageCss = `@page {
  size: ${reportPrintProfile.page.size};
  margin: ${reportPrintProfile.page.marginMm}mm;
}`;

export const reportPrintSharedCss = `.report-print-table tbody.report-print-area-group tr:first-child > td {
  border-top: ${reportPrintProfile.table.borderPx}px solid ${reportPrintProfile.table.borderColor} !important;
}`;
