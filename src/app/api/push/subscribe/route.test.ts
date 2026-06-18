/**
 * route.test.ts — Tests for POST /api/push/subscribe.
 *
 * Tests the push subscription endpoint, focusing on the Phase 14
 * encryptedKeys column fix (MEDIUM-2). The DB and encryption modules
 * are mocked to isolate route logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the DB module.
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: mockValues.mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate.mockReturnValue({
          onConflictDoUpdate: mockOnConflictDoUpdate,
        }),
      }),
    })),
  },
  pushSubscriptions: {
    endpoint: "endpoint",
    encryptedKeys: "encrypted_keys",
  },
}));

// Mock the encryption module.
vi.mock("@/lib/security/encrypt", () => ({
  encryptPushKeys: vi.fn().mockReturnValue("encrypted-envelope-string"),
}));

// Mock the auth DAL — verifySession returns a fake session.
vi.mock("@/lib/auth/dal", () => ({
  verifySession: vi.fn().mockResolvedValue({
    user: { id: "user-123", role: "reader", name: "Test User" },
    sessionId: "session-123",
  }),
}));

const { POST } = await import("./route");
const { encryptPushKeys } = await import("@/lib/security/encrypt");

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: {
    p256dh: "BNc...base64...",
    auth: "base64-auth-key",
  },
};

describe("POST /api/push/subscribe", () => {
  it("returns 201 on valid subscription", async () => {
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(201);
  });

  it("encrypts push keys before storage", async () => {
    await POST(makeRequest(validBody));
    expect(encryptPushKeys).toHaveBeenCalledWith(validBody.keys);
  });

  it("stores encrypted keys in encryptedKeys column (Phase 14 schema fix)", async () => {
    await POST(makeRequest(validBody));

    // Verify db.insert was called with encryptedKeys (not keys.p256dh)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptedKeys: "encrypted-envelope-string",
      })
    );

    // Verify the OLD keys field is NOT set to the encrypted envelope
    // (the old convention was keys: { p256dh: encryptedKeys, auth: "encrypted" })
    const callArg = mockValues.mock.calls[0]?.[0];
    expect(callArg.keys).toBeUndefined();
  });

  it("returns 400 for invalid subscription format", async () => {
    const response = await POST(makeRequest({ endpoint: "not-a-url" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for missing keys", async () => {
    const response = await POST(
      makeRequest({ endpoint: "https://example.com/push" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 500 when DB insert fails", async () => {
    mockValues.mockRejectedValueOnce(new Error("DB connection lost"));
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(500);
  });
});
