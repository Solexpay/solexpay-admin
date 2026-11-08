import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { b2Handlers } from "@/mocks/b2";
import { server } from "@/mocks/server";
import TransactionsPage from "./page";

describe("Transactions page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b2Handlers);
  });

  it("renders mock transaction rows and metrics", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <TransactionsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("WAL-20260418001"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Chidi Okafor/)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Volume today")[0]).toBeInTheDocument();
  });

  it("writes search filter to the URL", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <TransactionsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    const searchInput = await screen.findByPlaceholderText(
      "Search by reference…",
    );
    await user.type(searchInput, "WAL-2026");

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("reference")).toBe(
        "WAL-2026",
      ),
    );
  });

  it("opens the detail drawer when viewing a transaction", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <TransactionsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    const viewButtons = await screen.findAllByRole("button", {
      name: "View transaction",
    });
    await user.click(viewButtons[0]!);

    expect(
      await screen.findByRole("dialog", { name: "Transaction Details" }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Ledger entries"))[0],
    ).toBeInTheDocument();
  });

  it("exports transactions and displays a success toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <TransactionsPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("WAL-20260418001"))[0];
    const exportBtn = screen.getByRole("button", { name: /export csv/i });
    await user.click(exportBtn);

    expect(
      (await screen.findAllByText("Transactions exported"))[0],
    ).toBeInTheDocument();
  });
});
