export const reportPrintScreenCss = `@media screen {
  .report-print-first-title,
  .report-print-header-label,
  .report-print-title-row {
    display: none !important;
  }

  .report-print-table {
    border-collapse: separate !important;
    border-spacing: 0 !important;
  }

  .report-print-table thead {
    background: #f1f5f9 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 40 !important;
  }

  .report-print-table thead .report-screen-header-row th,
  .report-print-table thead .report-screen-subheader-row th {
    background-clip: border-box !important;
    background: #f1f5f9 !important;
    box-shadow: none !important;
    outline: 1px solid #cbd5e1;
    outline-offset: -1px;
    position: relative !important;
  }

  .report-print-table thead .report-print-header-label {
    display: none !important;
  }

  .report-print-table thead .report-screen-header-row th {
    z-index: 34;
  }

  .report-print-table thead .report-screen-subheader-row th {
    z-index: 33;
  }

  .report-print-table thead .report-screen-header-row th[rowspan] {
    z-index: 35;
  }
}`;
