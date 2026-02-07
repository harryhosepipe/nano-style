import { InMemorySessionStore } from './memory-store';
import { SessionService } from './service';

const store = new InMemorySessionStore();

export const sessionService = new SessionService(store);
