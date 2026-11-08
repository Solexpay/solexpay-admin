import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { server } from "@/mocks/server";
import AuditPage from "./page";

describe("Audit page", () => {
  beforeEach(() => server.resetHandlers());
  it("renders audit ledger rows", async () => {
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <AuditPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    expect(
      (await screen.findAllByText("USER_SUSPENDED"))[0],
    ).toBeInTheDocument();
  });
  it("stores action filters in the URL", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={update}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <AuditPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    (await screen.findAllByText("USER_SUSPENDED"))[0];
    await user.type(screen.getByLabelText("Filter action"), "USER_SUSPENDED");
    await waitFor(() =>
      expect(update.mock.lastCall?.[0].searchParams.get("action")).toBe(
        "USER_SUSPENDED",
      ),
    );
  });
  it("shows the hash-chain verification result and toast", async () => {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <AuditPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    (await screen.findAllByText("USER_SUSPENDED"))[0];
    await user.click(screen.getByRole("button", { name: "Verify Chain" }));
    expect(
      (await screen.findAllByText("Hash Chain Integrity Verified OK"))[0],
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Chain verified: 1 records valid."))[0],
    ).toBeInTheDocument();
  });
});
