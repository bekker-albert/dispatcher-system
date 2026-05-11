import type { ModuleLiveHandlerKey } from "../lib/domain/data-access/moduleLiveHandlerRegistry";
import type {
  Stage2ActivationEvidenceResult,
} from "../lib/domain/workspaces/stage2ActivationEvidenceValidation";

// Shared read-only Stage 2 CLI parsing helpers; this helper does not query MySQL or mutate the live registry.
export type Stage2CliParseResult<Value> = {
  value?: Value;
  error?: string;
};

export function valueAfter(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

export function valuesAfter(argv: string[], flag: string) {
  return argv.flatMap((value, index) => (
    value === flag && argv[index + 1] ? [argv[index + 1]] : []
  ));
}

export function parseLiveHandlerKeys(values: string[]) {
  const parsed = values.map(parseLiveHandlerKey);

  return {
    liveHandlerKeys: parsed.flatMap((result) => (result.value ? [result.value] : [])),
    parseErrors: parsed.flatMap((result) => (result.error ? [result.error] : [])),
  };
}

export function parseLiveHandlerKey(value: string): Stage2CliParseResult<ModuleLiveHandlerKey> {
  const [resource, databaseAction] = value.includes("/")
    ? value.split("/")
    : value.split(":");
  const trimmedResource = resource?.trim();
  const trimmedAction = databaseAction?.trim();

  if (!trimmedResource || !trimmedAction) {
    return {
      error: `Invalid --live-handler value "${value}". Use resource/action, for example taxation/list-waybills.`,
    };
  }

  return {
    value: {
      resource: trimmedResource,
      databaseAction: trimmedAction,
    },
  };
}

export function parseEvidenceResult(
  value: string | undefined,
  flag: string,
): Stage2CliParseResult<Stage2ActivationEvidenceResult> {
  if (!value) return {};
  if (value === "missing" || value === "failed" || value === "passed") {
    return { value };
  }

  return { error: `Invalid ${flag} value "${value}". Use missing, failed, or passed.` };
}

export function parseActivationScopeSize(
  value: string | undefined,
): Stage2CliParseResult<number> {
  if (!value) return {};
  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? { value: parsed }
    : { error: `Invalid --activation-scope-size value "${value}". Use an integer.` };
}

export function parseActivationScopeSizeOrNaN(value: string | undefined) {
  if (value === undefined) return 1;

  const activationScopeSize = Number(value.trim());
  return Number.isFinite(activationScopeSize) ? activationScopeSize : Number.NaN;
}

export function isPlaceholderText(value: string) {
  return /^(?:todo|tbd|n\/a|na|none|later|fix later|\-+|\.+)$/i.test(value.trim());
}
