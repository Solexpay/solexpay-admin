import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { b3Handlers } from "@/mocks/b3";
import { server } from "@/mocks/server";
import SchoolsPage from "./page";

describe("Schools page", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(...b3Handlers);
  });
  const renderPage = (onUrlUpdate?: OnUrlUpdateFunction) =>
    render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <SchoolsPage />
          <ConfirmDialog />
          <ToastOutlet />
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    );
  it("renders the school list", async () => {
    renderPage();
    expect(
      (await screen.findAllByText("University of Lagos"))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Covenant University")[0]).toBeInTheDocument();
  });
  it("stores a search filter in the URL", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    renderPage(update);
    (await screen.findAllByText("University of Lagos"))[0];
    await user.type(
      screen.getByPlaceholderText("Search schools..."),
      "Covenant",
    );
    await waitFor(() =>
      expect(update.mock.lastCall?.[0].searchParams.get("q")).toBe("Covenant"),
    );
  });
  it("runs Find missing logos and reports the result", async () => {
    const user = userEvent.setup();
    renderPage();
    (await screen.findAllByText("University of Lagos"))[0];
    await user.click(
      screen.getByRole("button", { name: "Find missing logos" }),
    );
    expect(
      (await screen.findAllByText("Found 2 logos"))[0],
    ).toBeInTheDocument();
  });
});
