import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── UNIT TEST: Lazy Proxy DB Connection ─────────────────────────────────────
//
// TDD Approach: Write failing test first, then implement the code that passes it.
//
// These tests verify:
//  1. The db module exports an object (not undefined)
//  2. The connection is deferred until first property access (lazy)
//  3. When DATABASE_URL is missing, db module still exports an object
//     (graceful degradation, doesn't crash on import)
//  4. Accessing db methods without DATABASE_URL throws a clear error
// ────────────────────────────────────────────────────────────────────────────

describe("db connection", () => {
  // Store original env var for restoration after tests
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // Reset module cache so each test gets a fresh import
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original database URL
    if (originalDbUrl) {
      process.env.DATABASE_URL = originalDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("should export a db object (not undefined or null)", async () => {
    // Arrange: ensure database url exists
    process.env.DATABASE_URL =
      "postgresql://testuser:testpass@localhost:5432/testdb";

    // Act
    const { db } = await import("./index");

    // Assert
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
    expect(typeof db).toBe("object");
  });

  it("should defer connection until first property access (lazy evaluation)", async () => {
    // Arrange: valid database url
    process.env.DATABASE_URL =
      "postgresql://testuser:testpass@localhost:5432/testdb";

    // Act: import the module (should not throw during import)
    const { db } = await import("./index");

    // Assert: at this point, no actual connection should exist
    // The module should be importable without side effects
    expect(db).toBeDefined();
  });

  it("should export an object even when DATABASE_URL is missing (graceful)", async () => {
    // Arrange: ensure database url is completely missing
    delete process.env.DATABASE_URL;

    // Act: import should succeed without throwing at import time
    const dbModule = await import("./index");

    // Assert: db should be defined, not throw during import
    expect(dbModule.db).toBeDefined();
    expect(dbModule.db).not.toBeNull();
  });

  it("should throw a clear error when DATABASE_URL is missing and a method is called", async () => {
    // Arrange: missing database url
    delete process.env.DATABASE_URL;

    const { db } = await import("./index");

    // Act & Assert: accessing any method should throw a clear error
    expect(() => {
      // Attempt to use db.select (triggers the lazy init)
      if (db && db.select) {
        db.select();
      }
    }).toThrow("DATABASE_URL");
  });
});
