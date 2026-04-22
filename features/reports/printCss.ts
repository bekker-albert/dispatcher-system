export const reportPrintCss = `
@page {
  size: A3 landscape;
  margin: 5mm;
}

.report-print-table tbody.report-print-area-group tr:first-child > td {
  border-top: 2px solid #64748b !important;
}

@media screen {
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
}

@media print {
  html,
  body {
    background: #ffffff !important;
    height: auto !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  .app-print-root {
    background: #ffffff !important;
    color: #0f172a !important;
    line-height: 1.1 !important;
    min-height: 0 !important;
    padding: 0 !important;
  }

  .app-print-shell {
    margin: 0 !important;
    max-width: none !important;
    width: 100% !important;
  }

  .app-print-header,
  .report-screen-toolbar,
  .report-screen-title {
    display: none !important;
  }

  .report-print-area,
  .report-print-area * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .report-print-area {
    position: static !important;
    inset: auto !important;
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
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .report-print-panel {
    display: block !important;
  }

  .report-print-title,
  .report-print-first-title {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  .report-print-first-title {
    color: #0f172a !important;
    display: block !important;
    font-size: 10pt !important;
    font-weight: 800 !important;
    line-height: 1.15 !important;
    margin: 0 0 3mm !important;
    text-align: center !important;
  }

  .report-print-table-scroll {
    display: block !important;
    border: 0 !important;
  }

  .report-print-table {
    border: 2px solid #64748b !important;
    height: 280mm !important;
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

  .report-print-table col.report-print-col-work-name {
    width: var(--report-print-work-name-width, 170px) !important;
  }

  .report-print-table col.report-print-col-day-reason {
    width: var(--report-print-day-reason-width, 175px) !important;
  }

  .report-print-table col.report-print-col-year-reason {
    width: var(--report-print-year-reason-width, 190px) !important;
  }

  .report-print-table th,
  .report-print-table td {
    line-height: 1.02 !important;
    padding: 0.8px 1.5px !important;
  }

  .report-print-table th {
    line-height: 1.08 !important;
    padding-bottom: 1.4px !important;
    padding-top: 1.4px !important;
  }

  .report-print-table tbody.report-print-area-group tr:first-child > td {
    border-top: 2px solid #64748b !important;
  }

  .report-print-table .report-print-th-work-name,
  .report-print-table .report-print-th-day-reason,
  .report-print-table .report-print-th-year-reason,
  .report-print-table .report-work-cell {
    max-width: none !important;
    min-width: 0 !important;
  }

  .report-print-table .report-work-cell,
  .report-print-table .report-reason-input {
    overflow-wrap: normal !important;
    white-space: pre-wrap !important;
    word-break: normal !important;
  }

  .report-print-table .report-reason-cell,
  .report-print-table .report-reason-cell-content {
    text-align: center !important;
    vertical-align: middle !important;
  }

  .report-print-table .report-reason-cell-content {
    align-items: center !important;
    display: flex !important;
    justify-content: center !important;
    min-height: 100% !important;
    width: 100% !important;
  }

  .report-print-table tr.report-print-fill-row > td {
    padding-bottom: var(--report-print-fill-padding-y, 0.8px) !important;
    padding-top: var(--report-print-fill-padding-y, 0.8px) !important;
  }

  .report-print-table thead th {
    box-shadow: none !important;
    position: static !important;
    top: auto !important;
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
    white-space: normal !important;
  }

  .report-print-table tbody {
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
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
`;
