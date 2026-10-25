export type Env = {
  DB: D1Database;
  AI: Ai;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET?: string;
  DEV_LOGIN?: string;
};

export type User = { id: string; email: string; name: string; picture: string | null };

export type AppEnv = { Bindings: Env; Variables: { user: User } };
