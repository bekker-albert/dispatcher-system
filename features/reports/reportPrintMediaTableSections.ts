export const reportPrintMediaTableLayoutCss = `  .report-print-table-scroll {
    display: block !important;
    border: 0 !important;
  }

  .report-print-table {
    border: 2px solid #64748b !important;
    height: auto !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    font-size: 7.6px !important;
    border-collapse: collapse !important;
  }

  .report-print-table colgroup {
    display: table-column-group !important;
  }

  .report-print-table col.report-print-col {
    width: var(--report-print-column-width, auto) !important;
  }

  .report-print-table col.report-print-col-work-name {
    width: var(--report-print-work-name-width, 170px) !important;
  }

  .report-print-table col.report-print-col-day-reason {
    width: var(--report-print-day-reason-width, 175px) !important;
  }

  .report-print-table col.report-print-col-year-reason {
    width: var(--report-print-year-reason-width, 190px) !important;
  }`;

export const reportPrintMediaCellMetricsCss = `  .report-print-table th,
  .report-print-table td {
    line-height: 1.02 !important;
    padding: 0.8px 1.5px !important;
  }

  .report-print-table .report-metric {
    gap: 0 !important;
    line-height: 1 !important;
  }

  .report-print-table .report-metric-value {
    font-size: 1em !important;
    font-weight: 700 !important;
    line-height: 1 !important;
  }

  .report-print-table .report-metric-note {
    color: #475569 !important;
    font-size: 1em !important;
    font-weight: 500 !important;
    line-height: 1.02 !important;
    white-space: nowrap !important;
  }

  .report-print-table th {
    line-height: 1.08 !important;
    padding-bottom: 1.4px !important;
    padding-top: 1.4px !important;
  }

  .report-print-table tbody.report-print-area-group tr:first-child > td {
    border-top: 2px solid #64748b !important;
  }`;

export const reportPrintMediaFillRowsCss = `  .report-print-table tr.report-print-fill-row > td {
    padding-bottom: var(--report-print-fill-padding-y, 0.8px) !important;
    padding-top: var(--report-print-fill-padding-y, 0.8px) !important;
  }`;

export const reportPrintMediaStaticHeaderCss = `  .report-print-table thead th {
    box-shadow: none !important;
    position: static !important;
    top: auto !important;
  }`;

export const reportPrintMediaTableHeaderCss = `  .report-print-table thead {
    background: #f1f5f9 !important;
    display: table-header-group !important;
  }

  .report-print-table thead,
  .report-print-table thead tr,
  .report-print-table thead th,
  .report-print-table thead th * {
    color: #0f172a !important;
  }

  .report-print-table thead th {
    background: #f1f5f9 !important;
  }

  .report-print-table thead .report-screen-header-content,
  .report-print-table thead th > span[aria-hidden] {
    display: none !important;
  }

  .report-print-table thead .report-print-header-label {
    color: #0f172a !important;
    display: block !important;
    font: inherit !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-wrap: anywhere !important;
    white-space: normal !important;
    word-break: normal !important;
  }`;
