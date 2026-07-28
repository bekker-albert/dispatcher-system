import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  authRequired,
  authSessionCookieName,
  getAuthDisabledUser,
} from "@/lib/server/auth/config";
import { getAuthSessionFromCookieValue } from "@/lib/server/auth/session";

type LogisticsAdminLayoutProps = {
  children: ReactNode;
};

function canManageLogistics(role: string, canManageUsers: boolean) {
  return role === "admin" || role === "dispatch-chief" || canManageUsers;
}

export default async function LogisticsAdminLayout({ children }: LogisticsAdminLayoutProps) {
  if (!authRequired()) {
    const user = getAuthDisabledUser();
    if (!canManageLogistics(user.role, user.canManageUsers)) redirect("/logistics");
    return children;
  }

  const cookieStore = await cookies();
  const session = await getAuthSessionFromCookieValue(
    cookieStore.get(authSessionCookieName)?.value,
  );

  // The parent logistics layout displays the login screen for anonymous users.
  if (!session) return children;

  if (!canManageLogistics(session.user.role, session.user.canManageUsers)) {
    redirect("/logistics");
  }

  return children;
}
