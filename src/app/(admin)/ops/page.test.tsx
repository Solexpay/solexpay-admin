import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { server } from "@/mocks/server";
import OpsPage from "./page";

describe("Operations page", () => {
  beforeEach(() => server.resetHandlers());
  it("renders dead outbox mock rows", async () => {
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <OpsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    expect(
      (await screen.findAllByText("ops.notification.sms.dead"))[0],
    ).toBeInTheDocument();
  });
  it("updates the URL when changing queue section", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={update}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <OpsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    (await screen.findAllByText("ops.notification.sms.dead"))[0];
    await user.click(screen.getByRole("tab", { name: "Compliance Flags" }));
    await waitFor(() =>
      expect(update.mock.lastCall?.[0].searchParams.get("tab")).toBe(
        "compliance",
      ),
    );
  });
  it("requeues an event after confirmation and toasts", async () => {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <OpsPage />
          <ConfirmDialog />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    (await screen.findAllByText("ops.notification.sms.dead"))[0];
    await user.click(screen.getAllByRole("button", { name: "Requeue" })[0]!);
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Requeue" }));
    expect(
      (await screen.findAllByText("Event successfully requeued"))[0],
    ).toBeInTheDocument();
  });
});
