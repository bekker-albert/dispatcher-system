import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";

import { LoginScreen } from "@/features/auth/LoginScreen";
import LogisticsShell from "@/features/logistics/LogisticsShell";
import {
  authRequired,
  authSessionCookieName,
  getAuthDisabledUser,
} from "@/lib/server/auth/config";
import { getAuthSessionFromCookieValue } from "@/lib/server/auth/session";

type LogisticsLayoutProps = {
  children: ReactNode;
};

const logisticsTitleStyle: CSSProperties = {
  position: "fixed",
  top: 24,
  left: "50%",
  zIndex: 10,
  transform: "translateX(-50%)",
  display: "grid",
  gap: 4,
  width: "min(520px, calc(100% - 48px))",
  textAlign: "center",
  color: "#0f172a",
  fontFamily: "var(--app-font)",
  pointerEvents: "none",
};

export default async function LogisticsLayout({ children }: LogisticsLayoutProps) {
  if (!authRequired()) {
    return <LogisticsShell user={getAuthDisabledUser()}>{children}</LogisticsShell>;
  }

  const cookieStore = await cookies();
  const session = await getAuthSessionFromCookieValue(
    cookieStore.get(authSessionCookieName)?.value,
  );

  if (session) {
    return <LogisticsShell user={session.user}>{children}</LogisticsShell>;
  }

  return (
    <div>
      <div style={logisticsTitleStyle}>
        <strong style={{ fontSize: 22 }}>Логистика Газели</strong>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          Войдите под своей учётной записью AA Mining
        </span>
      </div>
      <LoginScreen />
    </div>
  );
}
