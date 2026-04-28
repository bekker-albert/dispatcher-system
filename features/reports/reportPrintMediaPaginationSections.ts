export const reportPrintMediaPageBreakCss = `  .report-print-table tbody {
    display: table-row-group !important;
  }

  .report-print-table thead tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .report-print-table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .report-print-table tbody.report-print-area-group {
    break-inside: auto !important;
    page-break-inside: auto !important;
  }`;
