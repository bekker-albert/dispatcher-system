export const reportPrintMediaTextWrappingCss = `  .report-print-table .report-print-th-work-name,
  .report-print-table .report-print-th-day-reason,
  .report-print-table .report-print-th-year-reason,
  .report-print-table .report-area-cell,
  .report-print-table .report-reason-cell,
  .report-print-table .report-reason-cell-content,
  .report-print-table .report-reason-input,
  .report-print-table .report-reason-print-value,
  .report-print-table .report-work-cell {
    max-width: 100% !important;
    min-width: 0 !important;
  }

  .report-print-table .report-area-cell,
  .report-print-table .report-work-cell,
  .report-print-table .report-reason-cell,
  .report-print-table .report-reason-cell-content,
  .report-print-table .report-reason-print-value,
  .report-print-table .report-reason-input {
    overflow-wrap: anywhere !important;
    word-break: normal !important;
  }

  .report-print-table .report-work-cell,
  .report-print-table .report-reason-cell,
  .report-print-table .report-reason-cell-content,
  .report-print-table .report-reason-print-value,
  .report-print-table .report-reason-input {
    white-space: pre-wrap !important;
  }`;

export const reportPrintMediaReasonCellCss = `  .report-print-table .report-reason-cell,
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
  }`;

export const reportPrintMediaReasonInputCss = `  .report-reason-input {
    appearance: none !important;
    -webkit-appearance: none !important;
    border: 0 !important;
    display: none !important;
    box-shadow: none !important;
    resize: none !important;
    overflow: visible !important;
  }

  .report-reason-print-value {
    display: block !important;
  }

  .report-reason-input::placeholder {
    color: transparent !important;
    opacity: 0 !important;
  }`;
