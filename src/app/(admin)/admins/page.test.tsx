import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { server } from "@/mocks/server";
import AdminsPage from "./page";

let mockRole = "SUPER_ADMIN";
vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-001",
      email: "super@solexpay.com",
      firstName: "Super",
      lastName: "Admin",
      role: mockRole,
    },
    logout: vi.fn(),
    canAccess: (section: string) =>
      section !== "admins" || mockRole === "SUPER_ADMIN",
  }),
}));

describe("Admins page", () => {
  beforeEach(() => {
    mockRole = "SUPER_ADMIN";
    server.resetHandlers();
  });
  it("renders administrator mock rows with avatars", async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AdminsPage />
      </QueryClientProvider>,
    );
    expect((await screen.findAllByText(/Super Admin/))[0]).toBeInTheDocument();
  });
  it("resets TOTP after confirmation and shows the success toast", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AdminsPage />
        <ConfirmDialog />
        <ToastOutlet />
      </QueryClientProvider>,
    );
    (await screen.findAllByText("Super Admin"))[0];
    await user.click(screen.getAllByRole("button", { name: "Reset TOTP" })[0]!);
    await user.click(await screen.findByRole("button", { name: "Reset" }));
    expect(
      (
        await screen.findAllByText(
          "Administrator TOTP reset. They will re-enroll on next login.",
        )
      )[0],
    ).toBeInTheDocument();
  });
  it("hides admin actions for a role without access", () => {
    mockRole = "OPS";
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AdminsPage />
      </QueryClientProvider>,
    );
    expect(screen.getAllByText("Access Restricted")[0]).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create Admin" }),
    ).not.toBeInTheDocument();
  });
});
