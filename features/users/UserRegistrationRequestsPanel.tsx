"use client";

import { Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  appSystemNotificationEventName,
  type AppSystemNotificationDetail,
} from "@/shared/notifications/appNotificationBus";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { AuthRegistrationRequest } from "@/lib/domain/auth/types";

import {
  actionCellStyle,
  buttonStyle,
  cellStyle,
  dangerIconButtonStyle,
  iconButtonStyle,
  messageStyle,
  panelStyle,
  statusBoxStyle,
  tableStyle,
  tableWrapStyle,
  toolbarStyle,
} from "./UserManagementStyles";
import { formatDateTime } from "./UserManagementModel";
import {
  clearRegistrationRequestNotification,
  getRegistrationRequestIdFromNotificationId,
} from "./registrationRequestNotifications";
import { createRegistrationRequestDecisionLog } from "./registrationRequestAuditLog";

type RegistrationRequestsResponse = {
  requests?: AuthRegistrationRequest[];
  request?: AuthRegistrationRequest;
  error?: string;
};

type UserRegistrationRequestsPanelProps = {
  addAdminLog: (entry: AdminLogInput) => void;
  onApproved: () => Promise<void> | void;
};

const statusLabels: Record<AuthRegistrationRequest["status"], string> = {
  pending: "Ожидает",
  approved: "Согласована",
  rejected: "Отклонена",
};

export function UserRegistrationRequestsPanel({ addAdminLog, onApproved }: UserRegistrationRequestsPanelProps) {
  const [requests, setRequests] = useState<AuthRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const loadRequests = useCallback(async () => {
    setLoadError("");

    try {
      const response = await fetch("/api/auth/registration-requests", {
        headers: { "X-Dispatcher-Request": "same-origin" },
      });
      const body = await response.json().catch(() => ({})) as RegistrationRequestsResponse;
      if (!response.ok) {
        setLoadError(body.error || "Не удалось загрузить заявки");
        setRequests([]);
        return;
      }

      const pendingRequests = (body.requests ?? []).filter((request) => request.status === "pending");
      setRequests(pendingRequests);
    } catch {
      setLoadError("Не удалось загрузить заявки");
      setRequests([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();

    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<AppSystemNotificationDetail>).detail;
      if (!detail?.id) return;
      if (!getRegistrationRequestIdFromNotificationId(detail.id)) return;

      void loadRequests();
    };

    window.addEventListener(appSystemNotificationEventName, handleNotification);

    return () => {
      window.removeEventListener(appSystemNotificationEventName, handleNotification);
    };
  }, [loadRequests]);

  const decideRequest = async (request: AuthRegistrationRequest, decision: "approve" | "reject") => {
    if (decision === "reject" && !window.confirm(`Отклонить заявку ${request.displayName}?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/registration-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify({ id: request.id, decision }),
      });
      const body = await response.json().catch(() => ({})) as RegistrationRequestsResponse;
      if (!response.ok) {
        setMessage(body.error || "Заявка не обработана");
        return;
      }

      setMessage(decision === "approve" ? "Заявка согласована, пользователь создан" : "Заявка отклонена");
      addAdminLog(createRegistrationRequestDecisionLog(body.request ?? request, decision));
      clearRegistrationRequestNotification(request.id);
      await loadRequests();
      if (decision === "approve") await onApproved();
    } catch {
      setMessage("Не удалось обработать заявку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ ...panelStyle, marginBottom: 14 }}>
      <div style={toolbarStyle}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Заявки на регистрацию</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>Ожидают: {pendingCount}</span>
        </div>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}

      {initialLoading ? (
        <div style={statusBoxStyle}>Загружаем заявки...</div>
      ) : loadError ? (
        <div style={statusBoxStyle}>
          <div>{loadError}</div>
          <button type="button" onClick={() => void loadRequests()} disabled={loading} style={buttonStyle}>
            Повторить загрузку
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div style={statusBoxStyle}>
          <div>{"\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0437\u0430\u044f\u0432\u043e\u043a \u043d\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044e \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442."}</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            {"\u041d\u043e\u0432\u044b\u0435 \u0437\u0430\u044f\u0432\u043a\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438."}
          </div>
        </div>
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Дата</th>
                <th style={cellStyle}>Логин</th>
                <th style={cellStyle}>Фамилия Имя Отчество</th>
                <th style={cellStyle}>Контакты</th>
                <th style={cellStyle}>Статус</th>
                <th style={actionCellStyle}>Решение</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td style={cellStyle}>{formatDateTime(request.createdAt)}</td>
                  <td style={cellStyle}>{request.login}</td>
                  <td style={cellStyle}>{request.displayName}</td>
                  <td style={cellStyle}>{[request.email, request.phone].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={cellStyle}>{statusLabels[request.status]}</td>
                  <td style={actionCellStyle}>
                    {request.status === "pending" ? (
                      <>
                        <button type="button" onClick={() => void decideRequest(request, "approve")} disabled={loading} style={iconButtonStyle} title="Согласовать">
                          <Check size={15} aria-hidden />
                        </button>
                        <button type="button" onClick={() => void decideRequest(request, "reject")} disabled={loading} style={dangerIconButtonStyle} title="Отклонить">
                          <X size={15} aria-hidden />
                        </button>
                      </>
                    ) : (
                      request.reviewedByDisplayName || "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
