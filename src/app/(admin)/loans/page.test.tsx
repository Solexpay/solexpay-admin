import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { b2Handlers } from "@/mocks/b2";
import { server } from "@/mocks/server";
import LoansPage from "./page";

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

describe("Loans page", () => {
  beforeEach(() => {
    mockRole = "OPS";
    server.resetHandlers();
    server.use(...b2Handlers);
  });

  it("renders mock loan applications and metrics", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <LoansPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect((await screen.findAllByText("Chidi Okafor"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("University of Lagos")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Quick stats")[0]).toBeInTheDocument();
  });

  it("updates URL when switching to Ops Review tab", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <LoansPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("Chidi Okafor"))[0];
    const opsTab = screen.getByRole("tab", { name: "Ops Review" });
    await user.click(opsTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("tab")).toBe(
        "OPS_REVIEW",
      ),
    );
  });

  it("approves an ops-pending loan with confirmation and toast", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter searchParams={{ tab: "OPS_REVIEW" }}>
        <QueryClientProvider client={client}>
          <LoansPage />
          <ConfirmDialog />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect((await screen.findAllByText("Chidi Okafor"))[0]).toBeInTheDocument();

    const approveButtons = await screen.findAllByRole("button", {
      name: "Approve",
    });
    await user.click(approveButtons[0]!);

    // Confirm dialog appears
    const confirmBtn = await within(
      await screen.findByRole("alertdialog"),
    ).findByRole("button", { name: "Approve" });
    await user.click(confirmBtn);

    expect(
      (await screen.findAllByText(/Loan approved for/i))[0],
    ).toBeInTheDocument();
  });

  it("displays linked bank panel in loan detail modal", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter searchParams={{ tab: "OPS_REVIEW" }}>
        <QueryClientProvider client={client}>
          <LoansPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect((await screen.findAllByText("Chidi Okafor"))[0]).toBeInTheDocument();

    const viewButtons = await screen.findAllByRole("button", {
      name: "View Details",
    });
    await user.click(viewButtons[0]!);

    expect((await screen.findAllByText("Linked bank"))[0]).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Guaranty Trust Bank"))[0],
    ).toBeInTheDocument();
  });

  it("hides approve/reject action buttons for SUPPORT role", async () => {
    mockRole = "SUPPORT";
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter searchParams={{ tab: "OPS_REVIEW" }}>
        <QueryClientProvider client={client}>
          <LoansPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect((await screen.findAllByText("Chidi Okafor"))[0]).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reject" }),
    ).not.toBeInTheDocument();
  });
});
