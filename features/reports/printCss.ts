export const reportPrintCss = `
@page {
  size: A3 landscape;
  margin: 10mm;
}

@media print {
  html,
  body {
    background: #ffffff !important;
  }

  body * {
    visibility: hidden !important;
  }

  .report-print-area,
  .report-print-area * {
    visibility: visible !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .report-print-area {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    display: block !important;
    background: #ffffff !important;
  }

  .report-print-area > div,
  .report-print-panel,
  .report-print-table-scroll {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .report-print-area > div {
    padding: 0 !important;
    margin: 0 !important;
  }

  .report-print-panel {
    display: block !important;
  }

  .report-print-title {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    margin-bottom: 6px !important;
  }

  .report-print-table-scroll {
    border: 0 !important;
  }

  .report-print-table {
    width: 100% !important;
    min-width: 0 !important;
    font-size: 8.5px !important;
    border-collapse: collapse !important;
  }

  .report-print-table colgroup {
    display: table-column-group !important;
  }

  .report-print-table th,
  .report-print-table td {
    padding: 2px 3px !important;
  }

  .report-reason-input {
    appearance: none !important;
    -webkit-appearance: none !important;
    border: 0 !important;
    box-shadow: none !important;
    resize: none !important;
    overflow: visible !important;
  }

  .report-print-table thead {
    display: table-header-group !important;
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
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
`;
