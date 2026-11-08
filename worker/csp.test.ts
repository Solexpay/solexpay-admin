import { afterEach, describe, expect, it, vi } from "vitest";
import { htmlPolicy, nonceHtml } from "./csp";

describe("CSP builder", () => {
  it("includes the request nonce and strict framing/script rules", () => {
    const policy = htmlPolicy("bm9uY2U=");
    expect(policy).toContain("'nonce-bm9uY2U='");
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
  });
  it("adds the nonce to every script in an HTML document", async () => {
    class FakeRewriter {
      private handler:
        | {
            element(element: {
              setAttribute(name: string, value: string): void;
            }): void;
          }
        | undefined;
      on(
        _selector: string,
        handler: {
          element(element: {
            setAttribute(name: string, value: string): void;
          }): void;
        },
      ): this {
        this.handler = handler;
        return this;
      }
      transform(response: Response): Response {
        const handler = this.handler;
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const html = await response.text();
            const rewritten = html.replace(/<script\b([^>]*)>/gi, (tag) => {
              let nonce = "";
              handler?.element({
                setAttribute(name, value) {
                  if (name === "nonce") nonce = value;
                },
              });
              return tag.replace(/>$/, ` nonce="${nonce}">`);
            });
            controller.enqueue(new TextEncoder().encode(rewritten));
            controller.close();
          },
        });
        return new Response(stream, { headers: response.headers });
      }
    }
    vi.stubGlobal("HTMLRewriter", FakeRewriter);
    const result = nonceHtml(
      new Response("<script>one</script><script src='/x.js'></script>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
    const html = await result.response.text();
    expect((html.match(/nonce=/g) || []).length).toBe(2);
    expect(result.response.headers.get("Content-Security-Policy")).toContain(
      `'nonce-${result.nonce}'`,
    );
  });
});

afterEach(() => vi.unstubAllGlobals());
