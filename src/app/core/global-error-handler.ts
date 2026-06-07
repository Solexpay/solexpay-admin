import {
  ErrorHandler,
  Injectable,
  Injector,
  NgZone,
  inject,
} from "@angular/core";
import { ToastService } from "../services/toast.service";

export interface AppError {
  message?: string;
  error?: string | { message?: string };
}

function isAppError(err: unknown): err is AppError {
  return typeof err === "object" && err !== null;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);
  private zone = inject(NgZone);

  handleError(error: unknown): void {
    // 1. Log the error to the console
    console.error("Unhandled Global Exception Caught:", error);

    // 2. Safely trigger a UI notification on the screen inside the Angular zone
    this.zone.run(() => {
      const toastService = this.injector.get(ToastService);

      let message = "An unexpected error occurred.";
      if (typeof error === "string") {
        message = error;
      } else if (isAppError(error)) {
        if (typeof error.message === "string") {
          message = error.message;
        } else if (typeof error.error === "string") {
          message = error.error;
        } else if (typeof error.error === "object" && error.error?.message) {
          message = error.error.message;
        }
      }

      toastService.show("error", message);
    });
  }
}
