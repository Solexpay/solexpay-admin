import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { b4Handlers } from "@/mocks/b4";
import { server } from "@/mocks/server";
import AnalyticsPage from "./page";

vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-001",
      email: "ops@solexpay.com",
      firstName: "Chidi",
      lastName: "Admin",
      role: "SUPER_ADMIN",
    },
    logout: vi.fn(),
    canAccess: vi.fn().mockReturnValue(true),
  }),
}));

describe("Analytics page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b4Handlers);
  });

  it("renders headline metrics and feature usage", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter hasMemory>
        <QueryClientProvider client={client}>
          <AnalyticsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    expect(
      (await screen.findAllByText("Product Analytics"))[0],
    ).toBeInTheDocument();
    expect((await screen.findAllByText("1,420"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("Active Users")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Send Money")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Virtual Card")[0]).toBeInTheDocument();
    expect(
      screen.getAllByText(/Privacy-safe analytics/i)[0],
    ).toBeInTheDocument();
  });

  it("updates URL and refetches when a date window option is selected", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <AnalyticsPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );

    (await screen.findAllByText("Product Analytics"))[0];
    const sevenDaysTab = screen.getByRole("tab", { name: "Last 7 days" });
    await user.click(sevenDaysTab);

    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("days")).toBe("7"),
    );
  });
});
