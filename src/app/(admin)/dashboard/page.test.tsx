import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import DashboardPage from "./page";

describe("Dashboard page", () => {
  beforeEach(() => server.resetHandlers());
  it("renders dashboard metrics from the mock API", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Total users")).toBeInTheDocument();
    expect((await screen.findAllByText("John Doe")).length).toBeGreaterThan(0);
  });
});
