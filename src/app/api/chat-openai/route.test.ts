import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { mockAuthModule, setMockSession } from "@/lib/test/mocks/auth";
import { mockNextHeadersOnce } from "@/lib/test/mocks/headers";

describe("POST /api/chat-openai - auth", () => {
  beforeEach(() => {
    vi.resetModules();

    // Ensure mocks apply to the next import
    mockAuthModule();
    setMockSession(null);
    mockNextHeadersOnce();
  });

  it("returns 401 when not authenticated", async () => {
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/chat-openai", {
      method: "POST",
      body: JSON.stringify({ input: "hello" }),
      headers: { "content-type": "application/json" },
    }) as NextRequest;

    // Cast to NextRequest to satisfy the handler signature
    const res = await POST(req);

    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({
      status: "error",
      errorCode: 401,
      errorMessage: expect.stringContaining("Unauthorized"),
    });
  });
});
