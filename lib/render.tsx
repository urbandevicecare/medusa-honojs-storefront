import type { Context } from "hono";
import { Partial } from "../components/Partial.tsx";
import { Layout } from "../components/Layout.tsx";
import type { StoreState, AppEnv } from "./utils.ts";

/**
 * Universal page renderer supporting both full SSR layout and Hono partial fragment responses.
 *
 * When an incoming request includes `X-Hono-Partial: true`, `X-Partial: <name>`, or `f-partial: <name>`:
 * - If a specific sub-partial is targeted (e.g. `repair-content`), it returns just that partial.
 * - Otherwise, it returns `<title>` and `<Partial name="main">`, avoiding full `<head>`, `<Header>`, `<Footer>` transfer.
 *
 * Direct browser visits receive the full `<Layout>` HTML document.
 */
export function renderPage(
  c: Context<AppEnv>,
  content: any,
  state: StoreState = {},
) {
  const isPartial =
    c.req.header("X-Hono-Partial") === "true" ||
    c.req.header("X-Partial") !== undefined ||
    c.req.header("f-partial") !== undefined;

  const partialName = c.req.header("X-Partial") || c.req.header("f-partial");

  if (isPartial) {
    if (partialName && partialName !== "main") {
      // Sub-partial requested directly (e.g. repair-content)
      return c.html(content);
    }

    // Standard client navigation partial response:
    // Returns title and main partial container, omitting full layout overhead.
    return c.html(
      <>
        {state.title ? <title>{state.title}</title> : null}
        <Partial name="main" id="partial-main" class="flex-1 flex flex-col">
          {content}
        </Partial>
      </>,
    );
  }

  return c.html(
    <Layout state={state} title={state.title} description={state.description}>
      {content}
    </Layout>,
  );
}
