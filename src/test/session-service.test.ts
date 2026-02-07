import { describe, expect, it } from 'vitest';

import { InMemorySessionStore } from '../session/memory-store';
import { SessionService } from '../session/service';

describe('session service', () => {
  it('runs sparse retry once then defaults answer', async () => {
    const service = new SessionService(new InMemorySessionStore());
    const session = await service.startSession('general-cinematic', 'product shot');

    const firstAttempt = await service.answerSession(session.sessionId, 'ok');
    expect(firstAttempt.done).toBe(false);
    if (!firstAttempt.done) {
      expect(firstAttempt.questionText.toLowerCase()).toContain('what are we generating');
    }

    const secondAttempt = await service.answerSession(session.sessionId, 'ok');
    expect(secondAttempt.done).toBe(false);
    const refreshed = await service.getSession(session.sessionId);
    expect(refreshed.answers).toHaveLength(1);
    expect(refreshed.answers[0]?.answer.length).toBeGreaterThan(8);
  });

  it('completes after 3 answers', async () => {
    const service = new SessionService(new InMemorySessionStore());
    const session = await service.startSession('general-cinematic', 'cinematic food scene');
    await service.answerSession(session.sessionId, 'Fine dining close-up with hands plating.');
    await service.answerSession(session.sessionId, 'Soft window light with warm bounce.');
    const result = await service.answerSession(session.sessionId, 'Elegant, tactile, moody, realistic.');
    expect(result.done).toBe(true);
  });

  it('resets an existing session', async () => {
    const service = new SessionService(new InMemorySessionStore());
    const session = await service.startSession('general-cinematic', 'cinematic food scene');
    await service.resetSession(session.sessionId);
    await expect(service.getSession(session.sessionId)).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });
});
