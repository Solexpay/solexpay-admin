import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { b4Handlers } from "@/mocks/b4";
import { server } from "@/mocks/server";
import OffersPage from "./page";

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

vi.mock("@/lib/ui/confirm", () => ({
  confirm: vi.fn().mockResolvedValue(true),
  getLastConfirmReason: vi
    .fn()
    .mockReturnValue("Deactivated per marketing schedule"),
  useConfirm: () => ({ current: null, accept: vi.fn(), cancel: vi.fn() }),
}));

describe("Offers page", () => {
  beforeEach(() => {
    mockRole = "OPS";
    server.resetHandlers();
    server.use(...b4Handlers);
  });

  it("renders mock promotional offers and tallies", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <OffersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("0% Fee Tuition Financing"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Free Virtual USD Card")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Active Offers")[0]).toBeInTheDocument();
  });

  it("updates URL when filter tab is clicked", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <OffersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("0% Fee Tuition Financing"))[0];
    const activeTab = screen.getByRole("tab", { name: "Active" });
    await user.click(activeTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("filter")).toBe(
        "active",
      ),
    );
  });

  it("deactivates an active promo with confirm dialog and shows toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <OffersPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("0% Fee Tuition Financing"))[0];
    const deactivateButtons = screen.getAllByRole("button", {
      name: /deactivate/i,
    });
    await user.click(deactivateButtons[0]);

    expect(
      (await screen.findAllByText("Offer deactivated"))[0],
    ).toBeInTheDocument();
  });

  it("hides Create Offer and action buttons for SUPPORT role", async () => {
    mockRole = "SUPPORT";
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <OffersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("0% Fee Tuition Financing"))[0];
    expect(
      screen.queryByRole("button", { name: /create offer/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });
});
