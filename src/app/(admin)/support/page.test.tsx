import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { b4Handlers } from "@/mocks/b4";
import { server } from "@/mocks/server";
import SupportPage from "./page";

vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-001",
      email: "support@solexpay.com",
      firstName: "Chidi",
      lastName: "Support",
      role: "SUPPORT",
    },
    logout: vi.fn(),
    canAccess: vi.fn().mockReturnValue(true),
  }),
}));

describe("Support page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b4Handlers);
  });

  it("renders mock tickets and open counts", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <SupportPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect((await screen.findAllByText("TCK-2026-001"))[0]).toBeInTheDocument();
    expect(
      screen.getAllByText("Debit without wallet credit")[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Open Tickets")[0]).toBeInTheDocument();
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
          <SupportPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("TCK-2026-001"))[0];
    const openTab = screen.getByRole("tab", { name: "Open" });
    await user.click(openTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("status")).toBe(
        "OPEN",
      ),
    );
  });

  it("opens conversation thread and sends a reply, showing success toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <SupportPage />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("TCK-2026-001"))[0];
    const viewButtons = screen.getAllByRole("button", { name: "View thread" });
    await user.click(viewButtons[0]);

    expect(
      (
        await screen.findAllByText(
          "I funded my wallet with ₦25,000 via GTBank transfer 2 hours ago but my balance has not updated.",
        )
      )[0],
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Type your response to the customer/i,
    );
    await user.type(
      textarea,
      "We have verified the deposit and credited your balance.",
    );

    const sendBtn = screen.getByRole("button", { name: /Send reply/i });
    await user.click(sendBtn);

    expect(
      (await screen.findAllByText("Reply sent to customer"))[0],
    ).toBeInTheDocument();
  });
});
