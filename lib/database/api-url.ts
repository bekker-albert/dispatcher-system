export const productionApexOrigin = "https://aam-dispatch.kz";
export const productionCanonicalOrigin = "https://www.aam-dispatch.kz";
export const databaseApiPath = "/api/database";

export const defaultDatabaseCorsAllowedOrigins = [
  productionApexOrigin,
  productionCanonicalOrigin,
];

export function databaseApiUrlForHostname(hostname: string | undefined) {
  return hostname === new URL(productionApexOrigin).hostname
    ? `${productionCanonicalOrigin}${databaseApiPath}`
    : databaseApiPath;
}
