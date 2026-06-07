import { Injectable, inject } from "@angular/core";
import { ToastService } from "./toast.service";

interface UndoableAction {
  id: string;
  message: string;
  undo: () => void;
  timeout: ReturnType<typeof setTimeout>;
}

@Injectable({ providedIn: "root" })
export class SmartToastService {
  private undoableActions = new Map<string, UndoableAction>();
  private toastService = inject(ToastService);

  showWithUndo(message: string, undoFn: () => void, duration = 5000): string {
    const id = crypto.randomUUID();

    // Show special toast
    this.toastService.show("info", `${message} (Click to undo)`);

    // Store undo action
    const timeout = setTimeout(() => {
      this.undoableActions.delete(id);
    }, duration);

    this.undoableActions.set(id, {
      id,
      message,
      undo: undoFn,
      timeout,
    });

    return id;
  }

  undo(actionId: string): boolean {
    const action = this.undoableActions.get(actionId);

    if (action) {
      clearTimeout(action.timeout);
      action.undo();
      this.undoableActions.delete(actionId);
      this.toastService.show("success", "Action undone");
      return true;
    }

    return false;
  }

  confirmAction(message: string, confirmFn: () => void): void {
    // Show confirmation toast with action buttons
    const toast = this.toastService;
    toast.show("info", message);

    // In real implementation, this would render buttons
    // For now, auto-confirm after delay
    setTimeout(() => {
      confirmFn();
    }, 3000);
  }
}
