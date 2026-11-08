import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/server";
import LoginPage from "./page";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("returnUrl=%2Fusers"),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    server.resetHandlers();
    replace.mockClear();
  });

  it("renders email and password fields", () => {
    renderPage();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("logs in and redirects to the validated return URL", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Email Address"), "ops@solexpay.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
  });
});
