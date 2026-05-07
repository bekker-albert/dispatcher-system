import assert from "node:assert/strict";

import {
  checkAuthActionRateLimit,
  checkAuthLoginRateLimit,
  clearAuthActionRateLimit,
  clearAuthLoginRateLimit,
  createAuthActionRateLimitKey,
  createAuthLoginRateLimitKey,
  recordAuthActionAttempt,
  recordFailedAuthAttempt,
} from "../lib/server/auth/rate-limit";

const testOptions = { windowMs: 60_000, blockMs: 60_000, maxAttempts: 2 };
const request = new Request("https://aam-dispatch.kz/api/auth/test", {
  headers: { "x-forwarded-for": "203.0.113.10" },
});

const actionKey = createAuthActionRateLimitKey(request, "registration-test", "ALBERT.BEKKER");
clearAuthActionRateLimit(actionKey);

assert.equal(checkAuthActionRateLimit(actionKey, testOptions).allowed, true);
recordAuthActionAttempt(actionKey, testOptions);
assert.equal(checkAuthActionRateLimit(actionKey, testOptions).allowed, true);
recordAuthActionAttempt(actionKey, testOptions);
const blockedAction = checkAuthActionRateLimit(actionKey, testOptions);
assert.equal(blockedAction.allowed, false);
assert.ok(blockedAction.retryAfterSeconds > 0);
clearAuthActionRateLimit(actionKey);

const normalizedActionKey = createAuthActionRateLimitKey(request, "registration-test", "  albert.bekker  ");
assert.equal(normalizedActionKey, actionKey);

const loginKey = createAuthLoginRateLimitKey(request, "Dispatcher.Admin");
clearAuthLoginRateLimit(loginKey);
assert.equal(checkAuthLoginRateLimit(loginKey).allowed, true);
for (let index = 0; index < 5; index += 1) recordFailedAuthAttempt(loginKey);
assert.equal(checkAuthLoginRateLimit(loginKey).allowed, false);
clearAuthLoginRateLimit(loginKey);

console.log("Auth rate limit checks passed");
