import { vi } from "vitest";
type HeadersInitRecord = Record<string, string>;

export function mockNextHeadersOnce(headers: HeadersInitRecord = {}) {
  vi.doMock("next/headers", () => {
    return {
      headers: async () => {
        const h = new Headers(headers);
        return h;
      },
    };
  });
}
