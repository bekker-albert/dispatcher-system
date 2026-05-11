import type { MiningShift, MiningShiftReport, MiningShiftReportStatus } from "./service-contracts";

export type MiningShiftReportExpectedSubmission = {
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  expectedAt?: string;
  deadlineAt?: string;
};

export type MiningShiftReportSubmissionState = "missing" | MiningShiftReportStatus;

export type MiningShiftReportSubmissionControlRow = {
  key: string;
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  expectedAt?: string;
  deadlineAt?: string;
  reportId?: string;
  status: MiningShiftReportSubmissionState;
  isSubmitted: boolean;
  isAccepted: boolean;
  isOverdue: boolean;
  responsibleUserId?: string;
};

export type MiningShiftReportSubmissionSummary = {
  totalExpected: number;
  missingCount: number;
  overdueCount: number;
  returnedCount: number;
  acceptedCount: number;
  closedCount: number;
};

const submissionKey = (
  sectionId: string,
  reportDate: string,
  shift: MiningShift,
): string => [sectionId, reportDate, shift].join(":");

const isAfterIsoTime = (leftIso: string | undefined, rightIso: string | undefined): boolean => {
  if (!leftIso || !rightIso) {
    return false;
  }

  const left = Date.parse(leftIso);
  const right = Date.parse(rightIso);

  return Number.isFinite(left) && Number.isFinite(right) && left > right;
};

export const createMiningShiftReportSubmissionKey = submissionKey;

export const buildMiningShiftReportSubmissionControlRows = (
  expectations: readonly MiningShiftReportExpectedSubmission[],
  reports: readonly MiningShiftReport[],
  nowIso?: string,
): MiningShiftReportSubmissionControlRow[] => {
  const reportsByKey = new Map(
    reports.map((report) => [
      submissionKey(report.sectionId, report.reportDate, report.shift),
      report,
    ]),
  );

  return expectations
    .map((expectation) => {
      const key = submissionKey(expectation.sectionId, expectation.reportDate, expectation.shift);
      const report = reportsByKey.get(key);
      const status: MiningShiftReportSubmissionState = report?.status ?? "missing";
      const isAccepted = status === "accepted" || status === "closed";
      const isSubmitted = status !== "missing" && status !== "draft";
      const isOverdue = !isAccepted && (
        isAfterIsoTime(nowIso, expectation.deadlineAt)
        || isAfterIsoTime(report?.submittedAt, expectation.deadlineAt)
      );

      return {
        key,
        sectionId: expectation.sectionId,
        reportDate: expectation.reportDate,
        shift: expectation.shift,
        expectedAt: expectation.expectedAt,
        deadlineAt: expectation.deadlineAt,
        reportId: report?.id,
        status,
        isSubmitted,
        isAccepted,
        isOverdue,
        responsibleUserId: report?.submittedBy,
      };
    })
    .sort((left, right) => (
      left.reportDate.localeCompare(right.reportDate)
      || left.sectionId.localeCompare(right.sectionId)
      || left.shift.localeCompare(right.shift)
    ));
};

export const summarizeMiningShiftReportSubmissions = (
  rows: readonly MiningShiftReportSubmissionControlRow[],
): MiningShiftReportSubmissionSummary => ({
  totalExpected: rows.length,
  missingCount: rows.filter((row) => row.status === "missing").length,
  overdueCount: rows.filter((row) => row.isOverdue).length,
  returnedCount: rows.filter((row) => row.status === "returned").length,
  acceptedCount: rows.filter((row) => row.status === "accepted").length,
  closedCount: rows.filter((row) => row.status === "closed").length,
});
