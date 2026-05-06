"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";
import {
  clearRegistrationRequestNotification,
  dispatchRegistrationRequestNotification,
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

        if (notifyNew && knownPendingIds) {
          pendingRequests
            .filter((request) => !knownPendingIds.has(request.id))
            .forEach(dispatchRegistrationRequestNotification);

          knownPendingIds.forEach((requestId) => {
            if (!nextPendingIds.has(requestId)) {
              clearRegistrationRequestNotification(requestId);
            }
          });
        }

        knownPendingRequestIdsRef.current = nextPendingIds;
      } catch {
        // Фоновый watcher не должен ломать интерфейс: ошибки видны в самой вкладке профиля.
      }
    };

    void loadRequests({ notifyNew: false });

    const refreshTimer = window.setInterval(() => {
      void loadRequests();
    }, 15000);
    const handleFocus = () => {
      void loadRequests();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user.canManageUsers]);

  return null;
}
