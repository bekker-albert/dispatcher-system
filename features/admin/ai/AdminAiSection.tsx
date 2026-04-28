import {
  AdminAiAccumulatedReasonsPanel,
  AdminAiDatabasePanel,
  AdminAiHeader,
  AdminAiPreviewGrid,
  AdminAiReasonPreviewPanel,
  AdminAiRuleGrid,
  AdminAiSourceGrid,
} from "./AdminAiParts";
import {
  adminAiAccumulationContent,
  adminAiDatabaseContent,
  adminAiHeaderContent,
  adminAiReasonPreviewContent,
  adminAiRuleContent,
  adminAiSourceNotes,
} from "./adminAiContent";
import { sectionStyle } from "./adminAiStyles";

export function AdminAiSection() {
  return (
    <div style={sectionStyle}>
      <AdminAiHeader content={adminAiHeaderContent} />
      <AdminAiSourceGrid notes={adminAiSourceNotes} />
      <AdminAiPreviewGrid>
        <AdminAiReasonPreviewPanel content={adminAiReasonPreviewContent} />
        <AdminAiAccumulatedReasonsPanel content={adminAiAccumulationContent} />
      </AdminAiPreviewGrid>
      <AdminAiDatabasePanel content={adminAiDatabaseContent} />
      <AdminAiRuleGrid rules={adminAiRuleContent} />
    </div>
  );
}
