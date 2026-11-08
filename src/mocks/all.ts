import type { HttpHandler } from "msw";
import { b1Handlers } from "./b1";
import { b2Handlers } from "./b2";
import { b3Handlers } from "./b3";
import { b4Handlers } from "./b4";
import { handlers } from "./handlers";
import { telemetryHandlers } from "./telemetry";

/**
 * Every MSW handler. Feature mocks come first so they override the base set
 * where both answer the same route (MSW uses the first match).
 */
export const allHandlers: HttpHandler[] = [
  ...b1Handlers,
  ...b2Handlers,
  ...b3Handlers,
  ...b4Handlers,
  ...telemetryHandlers,
  ...handlers,
];
