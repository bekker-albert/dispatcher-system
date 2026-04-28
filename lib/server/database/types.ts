export type DatabaseRequest = {
  resource?: string;
  action?: string;
  payload?: unknown;
};

export type DatabaseJsonResponse = (data: unknown, status?: number) => Response;

export type DatabaseActionContext = {
  action?: string;
  payload?: unknown;
  request: Request;
  json: DatabaseJsonResponse;
};

export type DatabaseResourceHandler = (
  context: DatabaseActionContext,
) => Promise<Response | undefined> | Response | undefined;
