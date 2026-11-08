import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { server } from "@/mocks/server";
import KycPage from "./page";

describe("KYC page", () => {
  beforeEach(() => server.resetHandlers());
  it("renders mock KYC rows", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={client}>
          <KycPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    expect((await screen.findAllByText("John Doe")).length).toBeGreaterThan(0);
  });

  it("confirms an approval, calls the API and shows a toast", async () => {
    const user = userEvent.setup();
    const approveRequest = vi.fn();
    server.use(
      http.post("*/admin/kyc/:verificationId/approve", ({ params }) => {
        approveRequest(params.verificationId);
        return HttpResponse.json({ success: true, message: "KYC approved" });
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={client}>
          <KycPage />
          <ConfirmDialog />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    await screen.findAllByText("John Doe");
    await user.click(screen.getAllByRole("button", { name: "Approve" })[0]!);
    const confirmButtons = await screen.findAllByRole("button", {
      name: "Approve",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]!);
    expect(approveRequest).toHaveBeenCalledWith("kyc-001");
    expect(
      await screen.findByText("KYC verification approved"),
    ).toBeInTheDocument();
  });
});
