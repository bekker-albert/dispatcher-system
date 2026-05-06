"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import {
  aiAssistantSystemNotificationDecisionEventName,
  type AiAssistantSystemNotificationDecisionDetail,
} from "@/features/ai-assistant/lib/systemNotifications";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";
import {
  clearRegistrationRequestNotification,
  dispatchRegistrationRequestNotification,
  getRegistrationRequestIdFromNotificationId,
} from "./registrationRequestNotifications";

type RegistrationRequestsResponse = {
  requests?: AuthRegistrationRequest[];
};

export function UserRegistrationRequestsWatcher() {
  const { user } = useAuth();
  const knownPendingRequestIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!user.canManageUsers) {
      knownPendingRequestIdsRef.current = null;
      return;
    }

    let disposed = false;

    const loadRequests = async ({ notifyNew = true }: { notifyNew?: boolean } = {}) => {
      try {
        const response = await fetch("/api/auth/registration-requests", {
          headers: { "X-Dispatcher-Request": "same-origin" },
        });
        if (!response.ok) return;

        const body = await response.json().catch(() => ({})) as RegistrationRequestsResponse;
        if (disposed) return;

        const pendingRequests = (body.requests ?? []).filter((request) => request.status === "pending");
        const nextPendingIds = new Set(pendingRequests.map((request) => request.id));
        const knownPendingIds = knownPendingRequestIdsRef.current;

        if (notifyNew) {
          const requestsForNotification = knownPendingIds
            ? pendingRequests.filter((request) => !knownPendingIds.has(request.id))
            : pendingRequests;

          requestsForNotification.forEach(dispatchRegistrationRequestNotification);

          if (knownPendingIds) {
            knownPendingIds.forEach((requestId) => {
              if (!nextPendingIds.has(requestId)) {
                clearRegistrationRequestNotification(requestId);
              }
            });
          }
        }

        knownPendingRequestIdsRef.current = nextPendingIds;
      } catch {
        // Фоновый watcher не должен ломать интерфейс: ошибки видны в самой вкладке профиля.
      }
    };

    const decideFromNotification = async (detail: AiAssistantSystemNotificationDecisionDetail) => {
      const requestId = getRegistrationRequestIdFromNotificationId(detail.id);
      if (!requestId) return;
      if (detail.status === "rejected" && !window.confirm("Отклонить заявку на регистрацию?")) return;

      try {
        const response = await fetch("/api/auth/registration-requests", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Dispatcher-Request": "same-origin",
          },
          body: JSON.stringify({
            id: requestId,
            decision: detail.status === "approved" ? "approve" : "reject",
          }),
        });
        if (!response.ok || disposed) return;

        clearRegistrationRequestNotification(requestId);
        await loadRequests({ notifyNew: false });
      } catch {
        // Ошибки быстрого решения не скрываем в основной вкладке профиля.
      }
    };

    const handleNotificationDecision = (event: Event) => {
      const detail = (event as CustomEvent<AiAssistantSystemNotificationDecisionDetail>).detail;
      if (!detail?.id) return;
      void decideFromNotification(detail);
    };

    void loadRequests({ notifyNew: true });

    const handleFocus = () => {
      void loadRequests();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(aiAssistantSystemNotificationDecisionEventName, handleNotificationDecision);

    return () => {
      disposed = true;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(aiAssistantSystemNotificationDecisionEventName, handleNotificationDecision);
    };
  }, [user.canManageUsers]);

  return null;
}
