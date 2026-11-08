import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { server } from "@/mocks/server";
import NotificationsPage from "./page";

describe("Notification preferences page", () => {
  beforeEach(() => server.resetHandlers());
  it("renders saved notification settings", async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NotificationsPage />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "New User Registrations" }),
      ).toBeChecked(),
    );
  });
  it("saves changed preferences and shows the success toast", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NotificationsPage />
        <ToastOutlet />
      </QueryClientProvider>,
    );
    const toggle = await screen.findByRole("switch", { name: "System Alerts" });
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Save Preferences" }));
    expect(
      await screen.findByText("Notification preferences saved"),
    ).toBeInTheDocument();
  });
});
