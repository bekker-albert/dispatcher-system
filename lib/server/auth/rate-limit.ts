type AuthRateLimitState = {
  attempts: number;
  resetAt: number;
  blockedUntil: number;
};

type AuthRateLimitOptions = {
  windowMs: number;
  blockMs: number;
  maxAttempts: number;
};

const authRateLimit = new Map<string, AuthRateLimitState>();
const authLoginRateLimitOptions: AuthRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  blockMs: 10 * 60 * 1000,
  maxAttempts: 5,
};
const authSensitiveActionRateLimitOptions: AuthRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  blockMs: 10 * 60 * 1000,
  maxAttempts: 8,
};

function nowMs() {
  return Date.now();
}

function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function normalizeRateLimitSubject(value: string) {
  return value.trim().toLowerCase() || "empty";
}

function getState(key: string, options: AuthRateLimitOptions) {
  const now = nowMs();
  const current = authRateLimit.get(key);
  if (current && current.resetAt > now) return current;

  const fresh = { attempts: 0, resetAt: now + options.windowMs, blockedUntil: 0 };
  authRateLimit.set(key, fresh);
  return fresh;
}

function checkRateLimit(key: string, options: AuthRateLimitOptions) {
  const state = getState(key, options);
  const now = nowMs();
  const retryAfterSeconds = Math.max(1, Math.ceil((state.blockedUntil - now) / 1000));

  return {
    allowed: state.blockedUntil <= now,
    retryAfterSeconds,
  };
}

function recordAttempt(key: string, options: AuthRateLimitOptions) {
  const state = getState(key, options);
  state.attempts += 1;

  if (state.attempts >= options.maxAttempts) {
    state.blockedUntil = nowMs() + options.blockMs;
  }
}

export function createAuthLoginRateLimitKey(request: Request, login: string) {
  return `login:${getClientAddress(request)}:${normalizeRateLimitSubject(login)}`;
}

export function checkAuthLoginRateLimit(key: string) {
  return checkRateLimit(key, authLoginRateLimitOptions);
}

export function recordFailedAuthAttempt(key: string) {
  recordAttempt(key, authLoginRateLimitOptions);
}

export function clearAuthLoginRateLimit(key: string) {
  authRateLimit.delete(key);
}

export function createAuthActionRateLimitKey(request: Request, scope: string, subject: string) {
  return `${scope}:${getClientAddress(request)}:${normalizeRateLimitSubject(subject)}`;
}

export function checkAuthActionRateLimit(key: string, options: AuthRateLimitOptions = authSensitiveActionRateLimitOptions) {
  return checkRateLimit(key, options);
}

export function recordAuthActionAttempt(key: string, options: AuthRateLimitOptions = authSensitiveActionRateLimitOptions) {
  recordAttempt(key, options);
}

export function clearAuthActionRateLimit(key: string) {
  authRateLimit.delete(key);
}
