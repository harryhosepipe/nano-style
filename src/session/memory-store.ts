import type { SessionState } from '../schemas/domain';
import type { SessionStore } from './index';

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionState>();

  async create(input: SessionState): Promise<SessionState> {
    this.sessions.set(input.sessionId, input);
    return input;
  }

  async get(sessionId: string): Promise<SessionState | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async upsert(sessionId: string, input: SessionState): Promise<SessionState> {
    this.sessions.set(sessionId, input);
    return input;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
