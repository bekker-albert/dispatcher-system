import { reportPrintPageCss, reportPrintSharedCss } from "./reportPrintPageCss";
import { reportPrintMediaCss } from "./reportPrintMediaCss";
import { reportPrintScreenCss } from "./reportPrintScreenCss";

export const reportPrintCssSections = [
  reportPrintPageCss,
  reportPrintSharedCss,
  reportPrintScreenCss,
  reportPrintMediaCss,
] as const;
