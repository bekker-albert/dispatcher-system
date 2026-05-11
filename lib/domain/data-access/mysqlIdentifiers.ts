export const mysqlIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isSafeMysqlIdentifier(identifier: string) {
  return mysqlIdentifierPattern.test(identifier);
}

export function quoteMysqlIdentifier(identifier: string) {
  if (!isSafeMysqlIdentifier(identifier)) {
    throw new Error(`Unsafe MySQL identifier: ${identifier}`);
  }

  return `\`${identifier}\``;
}

export function quoteMysqlColumnPath(columnPath: string) {
  return columnPath.split(".").map(quoteMysqlIdentifier).join(".");
}
