import {
  reportPrintMediaAreaCss,
  reportPrintMediaDocumentCss,
  reportPrintMediaTitleCss,
} from "./reportPrintMediaDocumentSections";
import { reportPrintMediaPageBreakCss } from "./reportPrintMediaPaginationSections";
import {
  reportPrintMediaCellMetricsCss,
  reportPrintMediaFillRowsCss,
  reportPrintMediaStaticHeaderCss,
  reportPrintMediaTableHeaderCss,
  reportPrintMediaTableLayoutCss,
} from "./reportPrintMediaTableSections";
import {
  reportPrintMediaReasonCellCss,
  reportPrintMediaReasonInputCss,
  reportPrintMediaTextWrappingCss,
} from "./reportPrintMediaTextSections";

export const reportPrintMediaSections = [
  reportPrintMediaDocumentCss,
  reportPrintMediaAreaCss,
  reportPrintMediaTitleCss,
  reportPrintMediaTableLayoutCss,
  reportPrintMediaCellMetricsCss,
  reportPrintMediaTextWrappingCss,
  reportPrintMediaReasonCellCss,
  reportPrintMediaFillRowsCss,
  reportPrintMediaStaticHeaderCss,
  reportPrintMediaReasonInputCss,
  reportPrintMediaTableHeaderCss,
  reportPrintMediaPageBreakCss,
] as const;
