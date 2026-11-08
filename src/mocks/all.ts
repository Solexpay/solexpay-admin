import type { HttpHandler } from "msw";
import { handlers } from "./handlers";
import { telemetryHandlers } from "./telemetry";

/** Every MSW handler: the base set plus each feature's mock file. */
export const allHandlers: HttpHandler[] = [...handlers, ...telemetryHandlers];
