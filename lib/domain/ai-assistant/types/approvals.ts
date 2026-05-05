import type {
  AiAssistantActionRisk,
  AiAssistantActionType,
  AiAssistantApprovalStatus,
} from "./tasks";
import type { AiAssistantConnectorKey } from "./integrations";

export type AiAssistantApprovalAction = {
  id: string;
  taskId: string;
  title: string;
  actionType: AiAssistantActionType;
  risk: AiAssistantActionRisk;
  status: Extract<AiAssistantApprovalStatus, "required" | "approved" | "rejected">;
  targetConnector: AiAssistantConnectorKey;
  targetLabel: string;
  draftText: string;
  requestedBy: string;
  approver?: string;
  createdAt: string;
  updatedAt: string;
};
