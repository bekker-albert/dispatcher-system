import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { LoginScreen } from "@/features/auth/LoginScreen";
import { authRequired, authSessionCookieName } from "@/lib/server/auth/config";
import { getAuthSessionFromCookieValue } from "@/lib/server/auth/session";

type LogisticsLayoutProps = {
  children: ReactNode;
};

export default async function LogisticsLayout({ children }: LogisticsLayoutProps) {
  if (!authRequired()) return children;

  const cookieStore = await cookies();
  const session = await getAuthSessionFromCookieValue(
    cookieStore.get(authSessionCookieName)?.value,
  );

  return session ? children : <LoginScreen />;
}
