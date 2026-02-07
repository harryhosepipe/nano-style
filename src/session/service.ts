import { ApiError } from '../api/errors';
import type { QuestionIndex, SessionState } from '../schemas/domain';
import { SessionStateSchema } from '../schemas/domain';
import { getDefaultAnswer, getQuestionText } from './questions';
import type { SessionStore } from './index';
import { findTemplateById } from './templates';

const SPARSE_ANSWER_MIN_LENGTH = 8;

const sparseRetryTracker = new Map<string, Set<QuestionIndex>>();

export class SessionService {
  constructor(private readonly store: SessionStore) {}

  async startSession(templateId: string, initialInput: string): Promise<SessionState> {
    if (!findTemplateById(templateId)) {
      throw new ApiError('VALIDATION_ERROR', 400, 'Unknown templateId.', false);
    }
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const session: SessionState = {
      sessionId,
      templateId,
      initialInput: initialInput.trim(),
      answers: [],
      questionIndex: 1,
      status: 'refinement_q1',
      createdAt: now,
      lastUpdatedAt: now,
    };
    return this.store.create(SessionStateSchema.parse(session));
  }

  async getSession(sessionId: string): Promise<SessionState> {
    const session = await this.store.get(sessionId);
    if (!session) {
      throw new ApiError('SESSION_NOT_FOUND');
    }
    return session;
  }

  async answerSession(
    sessionId: string,
    rawAnswer: string,
    editFromQuestionIndex?: QuestionIndex,
  ): Promise<{ done: true; session: SessionState } | { done: false; session: SessionState; questionText: string }> {
    let session = await this.getSession(sessionId);

    if (editFromQuestionIndex !== undefined) {
      session = this.applyEditMode(session, editFromQuestionIndex);
    }

    const questionIndex = session.questionIndex;
    const trimmedAnswer = rawAnswer.trim();
    const isSparse = trimmedAnswer.length < SPARSE_ANSWER_MIN_LENGTH;
    const retrySet = getRetrySet(sessionId);
    const retryAlreadyUsed = retrySet.has(questionIndex);

    if (isSparse && !retryAlreadyUsed) {
      retrySet.add(questionIndex);
      return { done: false, session, questionText: getQuestionText(questionIndex) };
    }

    const normalizedAnswer = isSparse ? getDefaultAnswer(questionIndex) : trimmedAnswer;
    const now = new Date().toISOString();
    const nextAnswers = [...session.answers.filter((entry) => entry.questionIndex !== questionIndex)];
    nextAnswers.push({
      questionIndex,
      answer: normalizedAnswer,
      sparseRetryUsed: retryAlreadyUsed,
      answeredAt: now,
    });
    nextAnswers.sort((a, b) => a.questionIndex - b.questionIndex);

    const isLastQuestion = questionIndex === 3;
    const nextSession: SessionState = SessionStateSchema.parse({
      ...session,
      answers: nextAnswers,
      status: isLastQuestion ? 'ready_to_generate' : questionStatus(questionIndex + 1),
      questionIndex: isLastQuestion ? 3 : ((questionIndex + 1) as QuestionIndex),
      lastUpdatedAt: now,
    });
    await this.store.upsert(sessionId, nextSession);

    if (isLastQuestion) {
      return { done: true, session: nextSession };
    }
    return { done: false, session: nextSession, questionText: getQuestionText(nextSession.questionIndex) };
  }

  async markGenerating(sessionId: string): Promise<SessionState> {
    const current = await this.getSession(sessionId);
    const updated: SessionState = SessionStateSchema.parse({
      ...current,
      status: 'generating',
      lastUpdatedAt: new Date().toISOString(),
    });
    return this.store.upsert(sessionId, updated);
  }

  async markResultReady(sessionId: string, image: SessionState['lastImage']): Promise<SessionState> {
    const current = await this.getSession(sessionId);
    const updated: SessionState = SessionStateSchema.parse({
      ...current,
      status: 'result_ready',
      lastImage: image,
      lastUpdatedAt: new Date().toISOString(),
    });
    return this.store.upsert(sessionId, updated);
  }

  getCompleteAnswers(session: SessionState): [string, string, string] | null {
    const answers = [1, 2, 3].map((questionIndex) => session.answers.find((entry) => entry.questionIndex === questionIndex));
    if (answers.some((entry) => entry === undefined)) {
      return null;
    }
    return [answers[0]!.answer, answers[1]!.answer, answers[2]!.answer];
  }

  private applyEditMode(session: SessionState, editFromQuestionIndex: QuestionIndex): SessionState {
    const truncatedAnswers = session.answers.filter((entry) => entry.questionIndex < editFromQuestionIndex);
    return SessionStateSchema.parse({
      ...session,
      answers: truncatedAnswers,
      questionIndex: editFromQuestionIndex,
      status: questionStatus(editFromQuestionIndex),
      lastUpdatedAt: new Date().toISOString(),
    });
  }
}

const questionStatus = (questionIndex: number): SessionState['status'] => {
  if (questionIndex <= 1) {
    return 'refinement_q1';
  }
  if (questionIndex === 2) {
    return 'refinement_q2';
  }
  return 'refinement_q3';
};

const getRetrySet = (sessionId: string): Set<QuestionIndex> => {
  const current = sparseRetryTracker.get(sessionId);
  if (current) {
    return current;
  }
  const created = new Set<QuestionIndex>();
  sparseRetryTracker.set(sessionId, created);
  return created;
};
