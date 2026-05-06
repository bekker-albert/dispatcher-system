import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";

type RegistrationDecision = "approve" | "reject";

export function createRegistrationRequestDecisionLog(
  request: AuthRegistrationRequest,
  decision: RegistrationDecision,
): AdminLogInput {
  const approved = decision === "approve";
  const contacts = [request.email, request.phone].filter(Boolean).join(" / ");

  return {
    section: "Профиль",
    action: approved ? "Согласование" : "Отказ",
    details: [
      `Заявка на регистрацию ${request.displayName} (${request.login}) ${approved ? "согласована" : "отклонена"}.`,
      contacts ? `Контакты: ${contacts}.` : "",
    ].filter(Boolean).join(" "),
  };
}
