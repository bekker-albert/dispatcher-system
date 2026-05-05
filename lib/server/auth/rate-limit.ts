type AuthRateLimitState = {
  failures: number;
  resetAt: number;
  blockedUntil: number;
};

const authLoginRateLimit = new Map<string, AuthRateLimitState>();
const authLoginWindowMs = 15 * 60 * 1000;
const authLoginBlockMs = 10 * 60 * 1000;
const authLoginMaxFailures = 5;

function nowMs() {
  return Date.now();
}

function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function getState(key: string) {
  const now = nowMs();
  const current = authLoginRateLimit.get(key);
  if (current && current.resetAt > now) return current;

  const fresh = { failures: 0, resetAt: now + authLoginWindowMs, blockedUntil: 0 };
  authLoginRateLimit.set(key, fresh);
  return fresh;
}

export function createAuthLoginRateLimitKey(request: Request, login: string) {
  return `${getClientAddress(request)}:${login.trim().toLowerCase() || "empty"}`;
}

export function checkAuthLoginRateLimit(key: string) {
  const state = getState(key);
  const now = nowMs();
  const retryAfterSeconds = Math.max(1, Math.ceil((state.blockedUntil - now) / 1000));

  return {
    allowed: state.blockedUntil <= now,
    retryAfterSeconds,
  };
}

export function recordFailedAuthAttempt(key: string) {
  const state = getState(key);
  state.failures += 1;

  if (state.failures >= authLoginMaxFailures) {
    state.blockedUntil = nowMs() + authLoginBlockMs;
  }
}

export function clearAuthLoginRateLimit(key: string) {
  authLoginRateLimit.delete(key);
}
