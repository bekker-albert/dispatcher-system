import {
  handleDatabaseGet,
  handleDatabaseOptions,
  handleDatabasePost,
} from "@/lib/server/database/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const OPTIONS = handleDatabaseOptions;
export const GET = handleDatabaseGet;
export const POST = handleDatabasePost;
