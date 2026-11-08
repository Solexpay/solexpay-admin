import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { server } from "@/mocks/server";
import ProfilePage from "./page";

describe("Profile settings page", () => {
  beforeEach(() => server.resetHandlers());
  it("loads the profile details", async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProfilePage />
      </QueryClientProvider>,
    );
    expect(await screen.findByDisplayValue("Admin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin@solexpay.com")).toBeInTheDocument();
  });
  it("updates profile details and shows the success toast", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProfilePage />
        <ToastOutlet />
      </QueryClientProvider>,
    );
    const firstName = await screen.findByDisplayValue("Admin");
    await user.clear(firstName);
    await user.type(firstName, "Amaka");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(
      await screen.findByText("Profile updated successfully"),
    ).toBeInTheDocument();
  });
});
