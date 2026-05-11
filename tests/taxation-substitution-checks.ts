import assert from "node:assert/strict";
import {
  createTaxerSubstitutionSessionCommand,
  doTaxerSubstitutionPeriodsOverlap,
  findTaxerSubstitutionOverlapConflicts,
  isTaxerSubstitutionActiveOnDate,
  resolveTaxationActorContext,
} from "../lib/domain/taxation/substitution";
import type { TaxerSubstitutionSession } from "../lib/domain/taxation/service-contracts";

const activeSession: TaxerSubstitutionSession = {
  id: "substitution-1",
  version: 1,
  seniorTaxerUserId: "senior-1",
  replacedTaxerUserId: "taxer-1",
  sectionId: "baktay",
  validFrom: "2026-05-01",
  validTo: "2026-05-15",
  basis: "sick_leave",
  basisDocumentId: "hr-absence-1",
  status: "active",
  createdBy: "chief-1",
  approvedBy: "dispatch-chief",
  reason: "temporary replacement for sick leave",
};

assert.equal(isTaxerSubstitutionActiveOnDate(activeSession, "2026-05-08"), true);
assert.equal(isTaxerSubstitutionActiveOnDate({ ...activeSession, status: "closed" }, "2026-05-08"), false);
assert.equal(doTaxerSubstitutionPeriodsOverlap(activeSession, {
  validFrom: "2026-05-10",
  validTo: "2026-05-20",
}), true);

const rejectedWithoutReason = createTaxerSubstitutionSessionCommand({
  seniorTaxerUserId: "senior-1",
  sectionId: "baktay",
  validFrom: "2026-05-16",
  validTo: "2026-05-20",
  basis: "vacancy",
  createdBy: "chief-1",
  reason: " ",
});
assert.equal(rejectedWithoutReason.ok, false);
if (!rejectedWithoutReason.ok) {
  assert.equal(rejectedWithoutReason.rejection.code, "reason_required");
}

const conflicts = findTaxerSubstitutionOverlapConflicts({
  seniorTaxerUserId: "senior-1",
  sectionId: "baktay",
  validFrom: "2026-05-10",
  validTo: "2026-05-20",
}, [activeSession]);
assert.equal(conflicts[0].existingSessionId, "substitution-1");

const acceptedCommand = createTaxerSubstitutionSessionCommand({
  seniorTaxerUserId: "senior-1",
  replacedTaxerUserId: "taxer-2",
  sectionId: "karatau",
  validFrom: "2026-05-10",
  validTo: "2026-05-20",
  basis: "vacancy",
  createdBy: "chief-1",
  approvedBy: "dispatch-chief",
  reason: "vacant section taxer role",
}, [activeSession]);
assert.equal(acceptedCommand.ok, true);
if (acceptedCommand.ok) {
  assert.equal(acceptedCommand.command.entityType, "taxer_substitution_session");
  assert.equal(acceptedCommand.command.initialVersion, 1);
  assert.equal(acceptedCommand.command.writesChangeHistory, true);
}

const ownContext = resolveTaxationActorContext({
  actorUserId: "taxer-1",
  requestedSectionId: "baktay",
  ownSectionIds: ["baktay"],
  workDate: "2026-05-08",
  substitutions: [],
});
assert.equal(ownContext.ok, true);
if (ownContext.ok) {
  assert.equal(ownContext.mode, "own_section");
  assert.equal(ownContext.audit.substitutionSessionId, undefined);
}

const substitutionContext = resolveTaxationActorContext({
  actorUserId: "senior-1",
  requestedSectionId: "baktay",
  ownSectionIds: [],
  workDate: "2026-05-08",
  substitutions: [activeSession],
});
assert.equal(substitutionContext.ok, true);
if (substitutionContext.ok) {
  assert.equal(substitutionContext.mode, "substitution");
  assert.equal(substitutionContext.audit.substitutionSessionId, "substitution-1");
  assert.equal(substitutionContext.audit.substitutionBasis, "sick_leave");
}

const rejectedContext = resolveTaxationActorContext({
  actorUserId: "senior-1",
  requestedSectionId: "baktay",
  ownSectionIds: [],
  workDate: "2026-05-20",
  substitutions: [activeSession],
});
assert.equal(rejectedContext.ok, false);
if (!rejectedContext.ok) {
  assert.equal(rejectedContext.rejection.code, "section_not_allowed");
}

console.log("Taxation substitution checks passed");
