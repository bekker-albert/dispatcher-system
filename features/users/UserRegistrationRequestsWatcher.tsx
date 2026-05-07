"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import {
  appSystemNotificationDecisionEventName,
  appSystemNotificationEventName,
  type AppSystemNotificationDecisionDetail,
  type AppSystemNotificationDetail,
} from "@/shared/notifications/appNotificationBus";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";
import {
  clearRegistrationRequestNotification,
  dispatchRegistrationRequestNotification,
  getRegistrationRequestIdFromNotificationId,
} from "./registrationRequestNotifications";
import { createRegistrationRequestDecisionLog } from "./registrationRequestAuditLog";

const registrationRequestsPollIntervalMs = 15000;

type RegistrationRequestsResponse = {
  requests?: AuthRegistrationRequest[];
  request?: AuthRegistrationRequest;
};

type UserRegistrationRequestsWatcherProps = {
  addAdminLog: (entry: AdminLogInput) => void;
};

export function UserRegistrationRequestsWatcher({ addAdminLog }: UserRegistrationRequestsWatcherProps) {
  const { user } = useAuth();
  const knownPendingRequestIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!user.canManageUsers) {
      knownPendingRequestIdsRef.current = null;
      return;
    }

    let disposed = false;
    let pollTimerId: number | null = null;

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

    const scheduleNextPoll = () => {
      if (disposed) return;
      pollTimerId = window.setTimeout(() => {
        void pollRequests();
      }, registrationRequestsPollIntervalMs);
    };

    const pollRequests = async ({ notifyNew = true }: { notifyNew?: boolean } = {}) => {
      await loadRequests({ notifyNew });
      scheduleNextPoll();
    };

    const decideFromNotification = async (detail: AppSystemNotificationDecisionDetail) => {
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
        const body = await response.json().catch(() => ({})) as RegistrationRequestsResponse;
        if (!response.ok || disposed) return;

        if (body.request) {
          addAdminLog(createRegistrationRequestDecisionLog(
            body.request,
            detail.status === "approved" ? "approve" : "reject",
          ));
        }
        clearRegistrationRequestNotification(requestId);
        await loadRequests({ notifyNew: false });
      } catch {
        // Ошибки быстрого решения не скрываем в основной вкладке профиля.
      }
    };

    const handleNotificationDecision = (event: Event) => {
      const detail = (event as CustomEvent<AppSystemNotificationDecisionDetail>).detail;
      if (!detail?.id) return;
      void decideFromNotification(detail);
    };

    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<AppSystemNotificationDetail>).detail;
      if (!detail?.id) return;
      if (!getRegistrationRequestIdFromNotificationId(detail.id)) return;

      void loadRequests({ notifyNew: false });
    };

    void pollRequests({ notifyNew: false });

    const handleFocus = () => {
      void loadRequests();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(appSystemNotificationEventName, handleNotification);
    window.addEventListener(appSystemNotificationDecisionEventName, handleNotificationDecision);

    return () => {
      disposed = true;
      if (pollTimerId !== null) {
        window.clearTimeout(pollTimerId);
      }
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(appSystemNotificationEventName, handleNotification);
      window.removeEventListener(appSystemNotificationDecisionEventName, handleNotificationDecision);
    };
  }, [addAdminLog, user.canManageUsers]);

  return null;
}
