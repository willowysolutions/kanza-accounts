import type { Session, User } from "@prisma/client";

// The actual payload inside the nested `data`
export interface SessionData {
  session: Session;
  user: User;
}

// What betterFetch returns from /api/auth/get-session
export interface SessionResponse {
  data: SessionData;
  error: unknown; // you can make this stricter if you know the error shape
}

// Auth client session data type (returned by authClient.getSession())
export interface AuthClientSessionData {
  data: SessionResponse | null;
}

// Login data types
export interface LoginData {
  email: string;
  password: string;
}
