import AppRoot from "@/features/app/AppRoot";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { authRequired, authSessionCookieName, getAuthDisabledUser } from "@/lib/server/auth/config";
import { getAuthSessionFromCookieValue } from "@/lib/server/auth/session";
import { cookies } from "next/headers";

export default async function Page() {
  if (!authRequired()) {
    return <AppRoot initialAuthUser={getAuthDisabledUser()} />;
  }

  const cookieStore = await cookies();
  const session = await getAuthSessionFromCookieValue(cookieStore.get(authSessionCookieName)?.value);

  return session ? <AppRoot initialAuthUser={session.user} /> : <LoginScreen />;
}
