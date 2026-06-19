/**
 * layout.test.tsx — Verifies the admin layout wraps children in <AdminGuard>.
 *
 * This is a structural test that ensures the layout actually invokes the
 * guard. Without this test, a future refactor that accidentally removes
 * the guard from the layout would silently leak admin pages to public access.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";

// Mock the auth DAL so AdminGuard passes (renders children)
vi.mock("@/lib/auth/dal", () => ({
  verifyAdminSession: vi.fn().mockResolvedValue({
    id: "admin-1",
    role: "admin",
    name: "Admin",
  }),
}));

// Mock next/navigation redirect so AdminGuard doesn't actually throw
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Spy on AdminGuard to verify it's actually rendered by the layout
const AdminGuardSpy = vi.fn();
vi.mock("@/shared/components/auth/AdminGuard", () => ({
  AdminGuard: (props: { children: React.ReactNode }) => {
    AdminGuardSpy(props);
    return React.createElement(React.Fragment, null, props.children);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("(admin)/layout.tsx", () => {
  it("wraps children in <AdminGuard>", async () => {
    const { default: AdminLayout } = await import("./layout");
    const child = React.createElement("p", null, "Page Content");

    render(React.createElement(AdminLayout, { children: child }));

    // AdminGuard must have been invoked by the layout
    expect(AdminGuardSpy).toHaveBeenCalledTimes(1);
    // And the children must have been passed through
    expect(screen.getByText("Page Content")).toBeDefined();
  });
});
