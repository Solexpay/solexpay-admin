import { setupWorker } from "msw/browser";
import { allHandlers } from "./all";

export const worker = setupWorker(...allHandlers);
