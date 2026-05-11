import type {
  TaxerSubstitutionBasis,
  TaxerSubstitutionSession,
} from "./service-contracts";

export type TaxerSubstitutionSessionDraft = {
  seniorTaxerUserId: string;
  replacedTaxerUserId?: string;
  sectionId: string;
  validFrom: string;
  validTo: string;
  basis: TaxerSubstitutionBasis;
  basisDocumentId?: string;
  createdBy: string;
  approvedBy?: string;
  reason: string;
};

export type TaxerSubstitutionSessionCommand = TaxerSubstitutionSessionDraft & {
  entityType: "taxer_substitution_session";
  initialStatus: "active";
  initialVersion: 1;
  writesChangeHistory: true;
};

export type TaxerSubstitutionRejectionCode =
  | "reason_required"
  | "invalid_period"
  | "overlap_conflict";

export type TaxerSubstitutionOverlapConflict = {
  existingSessionId: string;
  seniorTaxerUserId: string;
  sectionId: string;
  validFrom: string;
  validTo: string;
};

export type TaxerSubstitutionCreateResult =
  | { ok: true; command: TaxerSubstitutionSessionCommand }
  | {
      ok: false;
      rejection: {
        code: TaxerSubstitutionRejectionCode;
        message: string;
        conflicts?: TaxerSubstitutionOverlapConflict[];
      };
    };

export type TaxationActorContextResult =
  | {
      ok: true;
      actorUserId: string;
      sectionId: string;
      mode: "own_section" | "substitution";
      audit: {
        enteredByUserId: string;
        actingSectionId: string;
        substitutionSessionId?: string;
        substitutionBasis?: TaxerSubstitutionBasis;
      };
    }
  | {
      ok: false;
      rejection: {
        code: "section_not_allowed";
        message: string;
      };
    };

const activeSubstitutionStatuses = new Set<TaxerSubstitutionSession["status"]>(["active"]);

const isOnOrAfter = (value: string, floor: string) => value >= floor;
const isOnOrBefore = (value: string, ceiling: string) => value <= ceiling;

export function doTaxerSubstitutionPeriodsOverlap(
  left: Pick<TaxerSubstitutionSession, "validFrom" | "validTo">,
  right: Pick<TaxerSubstitutionSession, "validFrom" | "validTo">,
) {
  return isOnOrBefore(left.validFrom, right.validTo) && isOnOrAfter(left.validTo, right.validFrom);
}

export function isTaxerSubstitutionActiveOnDate(
  session: Pick<TaxerSubstitutionSession, "status" | "validFrom" | "validTo">,
  workDate: string,
) {
  return activeSubstitutionStatuses.has(session.status)
    && isOnOrAfter(workDate, session.validFrom)
    && isOnOrBefore(workDate, session.validTo);
}

export function findTaxerSubstitutionOverlapConflicts(
  draft: Pick<TaxerSubstitutionSessionDraft, "seniorTaxerUserId" | "sectionId" | "validFrom" | "validTo">,
  existingSessions: readonly TaxerSubstitutionSession[],
): TaxerSubstitutionOverlapConflict[] {
  return existingSessions.flatMap((session) => {
    const conflictsWithDraft = session.status === "active"
      && session.seniorTaxerUserId === draft.seniorTaxerUserId
      && session.sectionId === draft.sectionId
      && doTaxerSubstitutionPeriodsOverlap(draft, session);

    return conflictsWithDraft
      ? [{
          existingSessionId: session.id,
          seniorTaxerUserId: session.seniorTaxerUserId,
          sectionId: session.sectionId,
          validFrom: session.validFrom,
          validTo: session.validTo,
        }]
      : [];
  });
}

export function createTaxerSubstitutionSessionCommand(
  draft: TaxerSubstitutionSessionDraft,
  existingSessions: readonly TaxerSubstitutionSession[] = [],
): TaxerSubstitutionCreateResult {
  if (!draft.reason.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Taxer substitution requires a reason for audit history.",
      },
    };
  }

  if (draft.validFrom > draft.validTo) {
    return {
      ok: false,
      rejection: {
        code: "invalid_period",
        message: "Taxer substitution period start must be before or equal to period end.",
      },
    };
  }

  const conflicts = findTaxerSubstitutionOverlapConflicts(draft, existingSessions);
  if (conflicts.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "overlap_conflict",
        message: "Senior taxer already has an active substitution for this section and period.",
        conflicts,
      },
    };
  }

  return {
    ok: true,
    command: {
      ...draft,
      entityType: "taxer_substitution_session",
      initialStatus: "active",
      initialVersion: 1,
      writesChangeHistory: true,
    },
  };
}

export function resolveTaxationActorContext({
  actorUserId,
  requestedSectionId,
  ownSectionIds,
  workDate,
  substitutions,
}: {
  actorUserId: string;
  requestedSectionId: string;
  ownSectionIds: readonly string[];
  workDate: string;
  substitutions: readonly TaxerSubstitutionSession[];
}): TaxationActorContextResult {
  if (ownSectionIds.includes(requestedSectionId)) {
    return {
      ok: true,
      actorUserId,
      sectionId: requestedSectionId,
      mode: "own_section",
      audit: {
        enteredByUserId: actorUserId,
        actingSectionId: requestedSectionId,
      },
    };
  }

  const activeSubstitution = substitutions.find((session) => (
    session.seniorTaxerUserId === actorUserId
    && session.sectionId === requestedSectionId
    && isTaxerSubstitutionActiveOnDate(session, workDate)
  ));

  if (!activeSubstitution) {
    return {
      ok: false,
      rejection: {
        code: "section_not_allowed",
        message: "Actor has neither own section access nor an active substitution session.",
      },
    };
  }

  return {
    ok: true,
    actorUserId,
    sectionId: requestedSectionId,
    mode: "substitution",
    audit: {
      enteredByUserId: actorUserId,
      actingSectionId: requestedSectionId,
      substitutionSessionId: activeSubstitution.id,
      substitutionBasis: activeSubstitution.basis,
    },
  };
}
