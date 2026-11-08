import { setupServer } from "msw/node";
import { allHandlers } from "./all";

export const server = setupServer(...allHandlers);
