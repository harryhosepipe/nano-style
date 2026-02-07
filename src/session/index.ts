import type { SessionState } from '../schemas/domain';

export type SessionStore = {
  create(input: SessionState): Promise<SessionState>;
  get(sessionId: string): Promise<SessionState | null>;
  upsert(sessionId: string, input: SessionState): Promise<SessionState>;
  delete(sessionId: string): Promise<void>;
};
