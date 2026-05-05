import { NextResponse } from "next/server";

function getUrlOrigin(value: string | null) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function getFirstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function getRequestOrigin(request: Request) {
  const forwardedHost = getFirstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? request.headers.get("host") ?? undefined;
  if (!host) return getUrlOrigin(request.url);

  const requestProtocol = request.url.startsWith("https:") ? "https" : "http";
  const protocol = getFirstForwardedValue(request.headers.get("x-forwarded-proto")) ?? requestProtocol;
  return `${protocol}://${host}`;
}

export function isAuthMutationAllowed(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    request.headers.get("x-dispatcher-request") === "same-origin"
    && (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site")
  ) {
    return true;
  }

  const requestOrigin = getRequestOrigin(request);
  const origin = getUrlOrigin(request.headers.get("origin"));
  const referer = getUrlOrigin(request.headers.get("referer"));

  if (origin || referer) {
    return Boolean(requestOrigin && (origin === requestOrigin || referer === requestOrigin));
  }

  return process.env.NODE_ENV !== "production";
}

export function createAuthMutationRejectedResponse() {
  return NextResponse.json({ error: "Запрос должен идти с этого же сайта." }, { status: 403 });
}
