const wialonErrorMessages: Record<number, string> = {
  1: "Invalid session",
  2: "Invalid service name",
  3: "Invalid result",
  4: "Invalid input",
  5: "Error performing request",
  6: "Unknown error",
  7: "Access denied",
  8: "Invalid user name or password",
  9: "Authorization server is unavailable",
  1001: "No messages for selected interval",
  1002: "Item with such unique property already exists",
  1003: "Only one request is allowed at the moment",
  1004: "Limit of messages has been exceeded",
};

export class WialonApiError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "WialonApiError";
  }
}

export function createWialonApiError(code: number, payload?: unknown) {
  return new WialonApiError(wialonErrorMessages[code] ?? `Wialon API error ${code}`, code, payload);
}

export function formatWialonError(error: unknown) {
  if (error instanceof WialonApiError) {
    return {
      error: error.message,
      code: error.code ?? null,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Wialon request failed",
    code: null,
  };
}
