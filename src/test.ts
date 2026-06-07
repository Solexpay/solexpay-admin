import "@angular/compiler";
import "@analogjs/vitest-angular/setup-zone";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

// Polyfill Web Streams for MSW in jsdom environment
const streamWebModule = "node:stream/web";
const { TransformStream, ReadableStream, WritableStream } = await import(
  /* @vite-ignore */ streamWebModule
);
Object.defineProperty(globalThis, "TransformStream", {
  value: TransformStream,
  writable: true,
});
Object.defineProperty(globalThis, "ReadableStream", {
  value: ReadableStream,
  writable: true,
});
Object.defineProperty(globalThis, "WritableStream", {
  value: WritableStream,
  writable: true,
});

// Polyfill DOMTokenList to support space-separated tokens in JSDOM
if (typeof document !== "undefined") {
  const div = document.createElement("div");
  const DOMTokenListProto = Object.getPrototypeOf(div.classList);

  const originalAdd = DOMTokenListProto.add;
  DOMTokenListProto.add = function (...tokens: string[]) {
    const splitTokens: string[] = [];
    for (const token of tokens) {
      if (typeof token === "string" && token.includes(" ")) {
        splitTokens.push(...token.split(/\s+/));
      } else {
        splitTokens.push(token);
      }
    }
    return originalAdd.apply(this, splitTokens);
  };

  const originalRemove = DOMTokenListProto.remove;
  DOMTokenListProto.remove = function (...tokens: string[]) {
    const splitTokens: string[] = [];
    for (const token of tokens) {
      if (typeof token === "string" && token.includes(" ")) {
        splitTokens.push(...token.split(/\s+/));
      } else {
        splitTokens.push(token);
      }
    }
    return originalRemove.apply(this, splitTokens);
  };
}

const { server } = await import("./mocks/server");

try {
  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch {
  // Already initialized — safe to ignore in subsequent spec files
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
