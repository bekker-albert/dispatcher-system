import { reportPrintProfile } from "./reportPrintProfile";

export const reportPrintMediaTableLayoutCss = `  .report-print-table-scroll {
    display: block !important;
    border: 0 !important;
  }

  .report-print-table {
    border: ${reportPrintProfile.table.borderPx}px solid ${reportPrintProfile.table.borderColor} !important;
    height: auto !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    font-size: ${reportPrintProfile.table.fontSizePx}px !important;
    border-collapse: collapse !important;
  }

  .report-print-table colgroup {
    display: table-column-group !important;
  }

  .report-print-table col.report-print-col {
    width: var(--report-print-column-width, auto) !important;
  }

  .report-print-table col.report-print-col-work-name {
    width: var(--report-print-work-name-width, ${reportPrintProfile.columns.cssFallbackWidths["work-name"]}px) !important;
  }

  .report-print-table col.report-print-col-day-reason {
    width: var(--report-print-day-reason-width, ${reportPrintProfile.columns.cssFallbackWidths["day-reason"]}px) !important;
  }

  .report-print-table col.report-print-col-year-reason {
    width: var(--report-print-year-reason-width, ${reportPrintProfile.columns.cssFallbackWidths["year-reason"]}px) !important;
  }`;

export const reportPrintMediaCellMetricsCss = `  .report-print-table th,
  .report-print-table td {
    line-height: ${reportPrintProfile.cells.lineHeight} !important;
    padding: ${reportPrintProfile.cells.paddingYPx}px ${reportPrintProfile.cells.paddingXPx}px !important;
  }

  .report-print-table .report-metric {
    gap: 0 !important;
    line-height: ${reportPrintProfile.cells.metricLineHeight} !important;
  }

  .report-print-table .report-metric-value {
    font-size: 1em !important;
    font-weight: 700 !important;
    line-height: ${reportPrintProfile.cells.metricLineHeight} !important;
  }

  .report-print-table .report-metric-note {
    color: ${reportPrintProfile.cells.noteColor} !important;
    font-size: 1em !important;
    font-weight: 500 !important;
    line-height: ${reportPrintProfile.cells.lineHeight} !important;
    white-space: nowrap !important;
  }

  .report-print-table th {
    line-height: ${reportPrintProfile.cells.headerLineHeight} !important;
    padding-bottom: ${reportPrintProfile.cells.headerPaddingYPx}px !important;
    padding-top: ${reportPrintProfile.cells.headerPaddingYPx}px !important;
  }

  .report-print-table tbody.report-print-area-group tr:first-child > td {
    border-top: ${reportPrintProfile.table.borderPx}px solid ${reportPrintProfile.table.borderColor} !important;
  }`;

export const reportPrintMediaFillRowsCss = `  .report-print-table tr.report-print-fill-row > td {
    padding-bottom: var(--report-print-fill-padding-y, ${reportPrintProfile.fillRows.fallbackPaddingPx}px) !important;
    padding-top: var(--report-print-fill-padding-y, ${reportPrintProfile.fillRows.fallbackPaddingPx}px) !important;
  }`;

export const reportPrintMediaStaticHeaderCss = `  .report-print-table thead th {
    box-shadow: none !important;
    position: static !important;
    top: auto !important;
  }`;

export const reportPrintMediaTableHeaderCss = `  .report-print-table thead {
    background: ${reportPrintProfile.header.background} !important;
    display: table-header-group !important;
  }

  .report-print-table thead,
  .report-print-table thead tr,
  .report-print-table thead th,
  .report-print-table thead th * {
    color: ${reportPrintProfile.header.textColor} !important;
  }

  .report-print-table thead th {
    background: ${reportPrintProfile.header.background} !important;
  }

  .report-print-table thead .report-screen-header-content,
  .report-print-table thead th > span[aria-hidden] {
    display: none !important;
  }

  .report-print-table thead .report-print-header-label {
    color: ${reportPrintProfile.header.textColor} !important;
    display: block !important;
    font: inherit !important;
    font-weight: ${reportPrintProfile.header.labelWeight} !important;
    line-height: ${reportPrintProfile.cells.headerLabelLineHeight} !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-wrap: anywhere !important;
    white-space: normal !important;
    word-break: normal !important;
  }`;
