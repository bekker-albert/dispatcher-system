import { dispatchAppSystemNotification } from "@/shared/notifications/appNotificationBus";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";

const registrationRequestNotificationPrefix = "auth-registration-";

export function getRegistrationRequestNotificationId(requestId: string) {
  return `${registrationRequestNotificationPrefix}${requestId}`;
}

export function getRegistrationRequestIdFromNotificationId(notificationId: string) {
  return notificationId.startsWith(registrationRequestNotificationPrefix)
    ? notificationId.slice(registrationRequestNotificationPrefix.length)
    : null;
}

export function dispatchRegistrationRequestNotification(request: AuthRegistrationRequest) {
  const contacts = [request.email, request.phone].filter(Boolean).join(" / ");

  dispatchAppSystemNotification({
    id: getRegistrationRequestNotificationId(request.id),
    title: "Новая заявка на регистрацию",
    body: [
      `${request.displayName} (${request.login}) ожидает согласования.`,
      contacts ? `Контакты: ${contacts}` : "",
    ].filter(Boolean).join("\n"),
    target: "Админка -> Профиль",
  });
}

export function clearRegistrationRequestNotification(requestId: string) {
  dispatchAppSystemNotification({
    action: "clear",
    id: getRegistrationRequestNotificationId(requestId),
  });
}
