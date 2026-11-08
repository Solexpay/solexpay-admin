import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let currentPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockCanAccess = vi.fn().mockReturnValue(true);

vi.mock("@/lib/auth/session", () => ({
  useAdminSession: () => ({
    status: "authenticated",
    admin: {
      id: "admin-123",
      email: "admin@solexpay.com",
      firstName: "Chidi",
      lastName: "Okafor",
      role: "SUPER_ADMIN",
    },
    logout: mockLogout,
    canAccess: mockCanAccess,
  }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPathname = "/dashboard";
  });

  it("renders navigation links and brand", () => {
    render(<Sidebar />);

    expect(screen.getByText("SolexPay")).toBeInTheDocument();
    expect(screen.getByText("Operations console")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("KYC queue")).toBeInTheDocument();
  });

  it("identifies active route correctly with aria-current", () => {
    currentPathname = "/users";
    render(<Sidebar />);

    const usersLink = screen.getByRole("link", { name: /users/i });
    expect(usersLink).toHaveAttribute("aria-current", "page");

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("calls onClose when a navigation link is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<Sidebar onClose={handleClose} />);

    const link = screen.getByRole("link", { name: /users/i });
    await user.click(link);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("filters navigation items when typing in jump search", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const searchInput = screen.getByPlaceholderText("Jump to…");
    await user.type(searchInput, "KYC");

    expect(screen.getByText("KYC queue")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("displays admin details and signs out", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    expect(screen.getByText("Chidi Okafor")).toBeInTheDocument();
    expect(screen.getByText("admin@solexpay.com")).toBeInTheDocument();

    const signoutBtn = screen.getByRole("button", { name: "Sign out" });
    await user.click(signoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
