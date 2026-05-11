export const reportPrintMediaDocumentCss = `  html,
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

  html.report-print-mode body *,
  body:has(.report-print-area) * {
    visibility: hidden !important;
  }

  html.report-print-mode .report-print-area,
  html.report-print-mode .report-print-area *,
  body:has(.report-print-area) .report-print-area,
  body:has(.report-print-area) .report-print-area * {
    visibility: visible !important;
  }

  html.report-print-mode .erp-shell,
  html.report-print-mode .erp-main,
  html.report-print-mode .erp-content,
  body:has(.report-print-area) .erp-shell,
  body:has(.report-print-area) .erp-main,
  body:has(.report-print-area) .erp-content {
    display: block !important;
    gap: 0 !important;
    grid-template-columns: none !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    width: 100% !important;
  }

  .app-print-header,
  .erp-sidebar,
  .erp-topbar,
  .erp-mobile-backdrop,
  .no-print,
  .report-screen-toolbar,
  .report-screen-title {
    display: none !important;
    visibility: hidden !important;
  }`;

export const reportPrintMediaAreaCss = `  .report-print-area,
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
  }`;

export const reportPrintMediaTitleCss = `  .report-print-title,
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
  }`;
