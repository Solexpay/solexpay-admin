import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { b2Handlers } from "@/mocks/b2";
import { server } from "@/mocks/server";
import NipTransfersPage from "./page";

describe("NIP Transfers page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b2Handlers);
  });

  it("renders mock NIP transfers", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <NipTransfersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("NIP-20260418001"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
  });

  it("updates URL when status tab is selected", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <NipTransfersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("NIP-20260418001"))[0];
    const pendingTab = screen.getByRole("tab", { name: "Pending" });
    await user.click(pendingTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("status")).toBe(
        "PENDING",
      ),
    );
  });

  it("opens transfer detail modal when clicking view details", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <NipTransfersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    const viewButtons = await screen.findAllByRole("button", {
      name: "View Full NIP Details",
    });
    await user.click(viewButtons[0]!);

    expect(
      await screen.findByRole("dialog", { name: "NIP Transfer Details" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Beneficiary Details")[0]).toBeInTheDocument();
  });
});
