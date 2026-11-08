import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetSessionForTests } from "@/lib/auth/session";
import { b1Handlers } from "@/mocks/b1";
import { server } from "@/mocks/server";
import UsersPage from "./page";

describe("Users page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b1Handlers);
    __resetSessionForTests();
  });
  it("renders mock customer rows", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={client}>
          <UsersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    expect((await screen.findAllByText("Chidi Okafor")).length).toBeGreaterThan(
      0,
    );
  });

  it("writes a search filter to the URL", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider client={client}>
          <UsersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    const input = await screen.findByPlaceholderText(
      "Search by name, email, phone...",
    );
    await user.type(input, "Amaka");
    await waitFor(() =>
      expect(
        onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get("search"),
      ).toBe("Amaka"),
    );
  });

  it("hides the compliance activity tab for a SUPPORT session", async () => {
    server.use(
      http.get("*/bff/auth/session", () =>
        HttpResponse.json({
          expiresIn: 1800,
          admin: {
            id: "support-1",
            email: "support@solexpay.com",
            firstName: "Support",
            lastName: "Agent",
            role: "SUPPORT",
          },
        }),
      ),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={client}>
          <UsersPage />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
    await screen.findAllByText("Chidi Okafor");
    fireEvent.click(
      screen.getAllByRole("button", { name: "View user details" })[0]!,
    );
    expect(await screen.findByText("User Details")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("tab", { name: "Activity" }),
      ).not.toBeInTheDocument(),
    );
  });
});
