import { reportPrintMediaSections } from "./reportPrintMediaSections";

export const reportPrintMediaCss = `@media print {
${reportPrintMediaSections.join("\n\n")}
}`;
