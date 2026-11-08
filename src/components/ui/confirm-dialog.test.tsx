import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { cancelConfirm, confirm } from "@/lib/ui/confirm";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    cancelConfirm();
  });

  it("does not render when there is no active request", () => {
    const { container } = render(<ConfirmDialog />);
    expect(container.firstChild).toBeNull();
  });

  it("renders active confirm request with title, message and buttons", async () => {
    render(<ConfirmDialog />);

    confirm({
      title: "Delete item?",
      message: "This will remove the item permanently.",
      confirmLabel: "Delete",
      tone: "danger",
    });

    expect(await screen.findByText("Delete item?")).toBeInTheDocument();
    expect(
      screen.getByText("This will remove the item permanently."),
    ).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    expect(deleteBtn).toHaveClass("ui-btn-danger");
  });

  it("requires reason when reasonLabel is provided", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    confirm({
      title: "Suspend user?",
      reasonLabel: "Reason for suspension",
      confirmLabel: "Suspend",
    });

    const confirmBtn = await screen.findByRole("button", { name: "Suspend" });
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText("");
    await user.type(textarea, "Suspected fraud");

    expect(confirmBtn).toBeEnabled();
  });

  it("requires exact typed string when typeToConfirm is provided", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    confirm({
      title: "Purge ledger?",
      typeToConfirm: "PURGE",
      confirmLabel: "Purge",
    });

    const confirmBtn = await screen.findByRole("button", { name: "Purge" });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByRole("textbox");
    await user.type(input, "WRONG");
    expect(confirmBtn).toBeDisabled();

    await user.clear(input);
    await user.type(input, "PURGE");
    expect(confirmBtn).toBeEnabled();
  });

  it("resolves true when submitted", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    const promise = confirm({
      title: "Action?",
      confirmLabel: "Yes",
    });

    const confirmBtn = await screen.findByRole("button", { name: "Yes" });
    await user.click(confirmBtn);

    const result = await promise;
    expect(result).toBe(true);
  });

  it("resolves false when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    const promise = confirm({
      title: "Action?",
      confirmLabel: "Yes",
    });

    const cancelBtn = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    const result = await promise;
    expect(result).toBe(false);
  });
});
