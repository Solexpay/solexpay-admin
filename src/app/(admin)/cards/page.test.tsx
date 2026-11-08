import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { b4Handlers } from "@/mocks/b4";
import { server } from "@/mocks/server";
import CardsPage from "./page";

let mockRole = "OPS";

vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-001",
      email: "ops@solexpay.com",
      firstName: "Chidi",
      lastName: "Ops",
      role: mockRole,
    },
    logout: vi.fn(),
    canAccess: vi.fn().mockReturnValue(true),
  }),
}));

// Mock confirm to immediately accept with a reason
vi.mock("@/lib/ui/confirm", () => ({
  confirm: vi.fn().mockResolvedValue(true),
  getLastConfirmReason: vi
    .fn()
    .mockReturnValue("Verified with issuing partner settlement"),
  useConfirm: () => ({ current: null, accept: vi.fn(), cancel: vi.fn() }),
}));

describe("Cards Movements page", () => {
  beforeEach(() => {
    mockRole = "OPS";
    server.resetHandlers();
    server.use(...b4Handlers);
  });

  it("renders mock card movements and settlement stats", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <CardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("MOV-20260608-01"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chidi Okafor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Needs Action")[0]).toBeInTheDocument();
  });

  it("updates URL when status filter tab is clicked", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <CardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("MOV-20260608-01"))[0];
    const completedTab = screen.getByRole("tab", { name: "Completed" });
    await user.click(completedTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("status")).toBe(
        "COMPLETED",
      ),
    );
  });

  it("completes a movement via Mark Completed and displays success toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <CardsPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("MOV-20260608-01"))[0];
    const completeButtons = screen.getAllByRole("button", { name: "Complete" });
    await user.click(completeButtons[0]);

    expect(
      (await screen.findAllByText("Card movement marked as completed"))[0],
    ).toBeInTheDocument();
  });

  it("hides Complete and Fail action buttons for SUPPORT role", async () => {
    mockRole = "SUPPORT";
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <CardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    // Earlier tests mutate the shared mock queue; wait for the page, not a row.
    await screen.findByRole("heading", { name: "Card Movements Queue" });
    await waitFor(() => expect(client.isFetching()).toBe(0));
    // Rows must have rendered, or "no action buttons" would pass vacuously.
    expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    expect(
      screen.queryByRole("button", { name: "Complete" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fail" }),
    ).not.toBeInTheDocument();
  });
});
