import { databaseRequest } from "@/lib/database/rpc";
import type { DispatchReasonCatalogs } from "@/lib/domain/dispatch/reason-catalog";

export type DataDispatchReasonCatalogResponse = {
  catalogs?: unknown;
};

export function loadDispatchReasonCatalogsFromDatabase() {
  return databaseRequest<DataDispatchReasonCatalogResponse>(
    "dispatch",
    "load-reason-catalogs",
    {},
  );
}

export function saveDispatchReasonCatalogsToDatabase(catalogs: DispatchReasonCatalogs) {
  return databaseRequest<DataDispatchReasonCatalogResponse>(
    "dispatch",
    "save-reason-catalogs",
    { catalogs },
  );
}
