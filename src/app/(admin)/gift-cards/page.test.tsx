import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { b2Handlers } from "@/mocks/b2";
import { server } from "@/mocks/server";
import GiftCardsPage from "./page";

let mockRole = "OPS";

vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-001",
      email: "ops@solexpay.com",
      firstName: "Chidi",
      lastName: "Admin",
      role: mockRole,
    },
    logout: vi.fn(),
    canAccess: vi.fn().mockReturnValue(true),
  }),
}));

describe("Gift Cards page", () => {
  beforeEach(() => {
    mockRole = "OPS";
    server.resetHandlers();
    server.use(...b2Handlers);
  });

  it("renders mock gift card orders and stats", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <GiftCardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("Steam $50 Gift Card"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chidi Okafor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Needs review")[0]).toBeInTheDocument();
  });

  it("updates URL when a status tab is clicked", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <GiftCardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("Steam $50 Gift Card"))[0];
    const deliveredTab = screen.getByRole("tab", { name: /delivered/i });
    await user.click(deliveredTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("status")).toBe(
        "DELIVERED",
      ),
    );
  });

  it("resolves an order as delivered with entered codes and shows toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <GiftCardsPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("Steam $50 Gift Card"))[0];
    const deliverButton = screen.getAllByRole("button", { name: "Deliver" })[0];
    await user.click(deliverButton);

    expect(
      (await screen.findAllByText("Resolve Order as Delivered"))[0],
    ).toBeInTheDocument();

    const codeInput = screen.getByPlaceholderText(
      /Enter codes separated by commas/i,
    );
    await user.type(codeInput, "STEAM-CODE-12345");

    const confirmButton = screen.getByRole("button", {
      name: "Confirm Delivered",
    });
    await user.click(confirmButton);

    expect(
      (await screen.findAllByText("Gift card marked as delivered"))[0],
    ).toBeInTheDocument();
  });

  it("hides Deliver and Fail actions for SUPPORT role without OPS permissions", async () => {
    mockRole = "SUPPORT";
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <GiftCardsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    // Earlier tests mutate the shared mock orders, so wait for the list to
    // finish loading rather than for a specific row.
    await screen.findByRole("heading", { name: "Gift Card Orders" });
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(
      screen.queryByRole("button", { name: "Deliver" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fail" }),
    ).not.toBeInTheDocument();
  });
});
