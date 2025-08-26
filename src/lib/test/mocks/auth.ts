import { vi } from "vitest";

type Session = { user: { id: string } } | null;

let currentSession: Session = {
  user: {
    id: "test-user-1",
  },
};

export function setMockSession(session: Session) {
  currentSession = session;
}

export function mockAuthModule() {
  vi.doMock("@/lib/auth", () => {
    return {
      auth: {
        api: {
          getSession: vi.fn(async () => currentSession),
        },
      },
    };
  });
}
