import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { mockAuthModule, setMockSession } from "@/lib/test/mocks/auth";
import { mockNextHeadersOnce } from "@/lib/test/mocks/headers";

describe("OpenAi chat route", () => {
  describe("authentication", () => {
    beforeEach(() => {
      vi.resetModules();

      mockAuthModule();
      setMockSession(null);
      mockNextHeadersOnce();
    });

    it("returns 401 when not authenticated", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ input: "hello" }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);

      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 401,
        errorMessage: expect.stringContaining("Unauthorized"),
      });
    });

    it("return object with correct structure when not authenticated", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ input: "hello" }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 401,
        errorMessage: expect.stringContaining("Unauthorized"),
      });
    });
  });
  describe("validation", () => {
    beforeEach(() => {
      vi.resetModules();

      mockAuthModule();
      setMockSession({ user: { id: "test-user" } });
      mockNextHeadersOnce();
    });

    it("returns 400 for when no body is passed", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns missing body error message when no body is passed", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
        },
      ) as NextRequest;

      const res = await POST(req);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining("Missing body"),
      });
    });

    it("returns 400 when empty JSON body is passed", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining("ZodError"),
      });
    });

    it("returns 400 when body does not match schema (empty input) - status only", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ input: "" }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns schema error message when input is empty string", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ input: "" }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining("Input cannot be empty"),
      });
    });

    it("returns 400 when input array contains invalid props (invalid role)", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({
            input: [
              {
                role: "invalid",
                content: "hello",
              },
            ],
          }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining(
          "Role must be one of: user, system, developer, or assistant",
        ),
      });
    });

    it("returns 400 when input array contains empty content", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({
            input: [
              {
                role: "user",
                content: "",
              },
            ],
          }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining(
          "Message content cannot be empty",
        ),
      });
    });

    it("returns 400 when body has unknown property without required fields", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ unknown_prop: true }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining("ZodError"),
      });
    });

    it("returns 400 when body has known and unknown properties", async () => {
      const { POST } = await import("@/app/api/chat-openai/route");

      const req = new Request(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/chat-openai`,
        {
          method: "POST",
          body: JSON.stringify({ input: "hello", unknown_prop: true }),
          headers: { "content-type": "application/json" },
        },
      ) as NextRequest;

      const res = await POST(req);

      const json = await res.json();
      expect(json).toMatchObject({
        status: "error",
        errorCode: 400,
        errorMessage: expect.stringContaining("Unrecognized key"),
      });
    });
  });
});
