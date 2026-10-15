import { assertEquals, assertMatch } from "@std/assert";
import { app } from "../server.tsx";
import { Partial } from "../components/Partial.tsx";

Deno.test("Partials - Partial component renders data-partial attribute and id correctly", () => {
  const result = Partial({
    name: "main",
    children: "Content Inside Main Partial",
  });
  const html = result.toString();
  assertMatch(html, /data-partial="main"/);
  assertMatch(html, /id="partial-main"/);
  assertMatch(html, /class="hono-partial"/);
  assertMatch(html, /Content Inside Main Partial/);
});

Deno.test("Partials - Sub-partial renders with custom name and classes", () => {
  const result = Partial({
    name: "repair-content",
    id: "custom-repair-id",
    class: "route-container my-custom-class",
    children: "Repair Content Here",
  });
  const html = result.toString();
  assertMatch(html, /data-partial="repair-content"/);
  assertMatch(html, /id="custom-repair-id"/);
  assertMatch(html, /class="hono-partial route-container my-custom-class"/);
  assertMatch(html, /Repair Content Here/);
});

Deno.test("Partials - Full page request contains layout, partial-main, and client-nav runtime", async () => {
  const res = await app.request("/");
  assertEquals(res.status, 200);
  const html = await res.text();

  // Contains HTML skeleton
  assertMatch(html, /<!DOCTYPE html>/i);
  assertMatch(html, /<html/i);
  assertMatch(html, /<head>/i);
  assertMatch(html, /data-client-nav="true"/);

  // Contains TopProgressBar
  assertMatch(html, /id="top-progress-bar"/);

  // Contains Partial "main"
  assertMatch(html, /data-partial="main"/);

  // Contains Client Navigation and Partial Swap script
  assertMatch(html, /data-partial/);
  assertMatch(html, /partial-start/);
  assertMatch(html, /partial-end/);
  assertMatch(html, /fresh:partial-start/);
  assertMatch(html, /fresh:partial-end/);
});

Deno.test("Partials - Requesting repair pages contains repair-content partial", async () => {
  // Track page
  const trackRes = await app.request("/repairs/track");
  assertEquals(trackRes.status, 200);
  const trackHtml = await trackRes.text();
  assertMatch(trackHtml, /data-partial="repair-content"/);
  assertMatch(trackHtml, /Track Repair Status/);

  // Book page
  const bookRes = await app.request("/repairs/book");
  assertEquals(bookRes.status, 200);
  const bookHtml = await bookRes.text();
  assertMatch(bookHtml, /data-partial="repair-content"/);
  assertMatch(bookHtml, /Book a Device Repair/);
});

Deno.test("Partials - Header X-Partial: repair-content returns isolated partial fragment without layout", async () => {
  const res = await app.request("/repairs/track", {
    headers: {
      "X-Hono-Partial": "true",
      "X-Partial": "repair-content",
    },
  });
  assertEquals(res.status, 200);
  const html = await res.text();

  // When requesting isolated partial, it should not contain full html/head/body layout
  assertEquals(html.includes("<!DOCTYPE html>"), false);
  assertEquals(html.includes("<html"), false);
  // It contains the partial content directly
  assertMatch(html, /data-partial="repair-content"/);
  assertMatch(html, /Track Repair Status/);
});

Deno.test("Partials - Client navigation with X-Hono-Partial returns main partial without full layout overhead", async () => {
  // Test multiple routes
  const routes = ["/", "/cart", "/news", "/about/our-story"];

  for (const route of routes) {
    const res = await app.request(route, {
      headers: {
        "X-Hono-Partial": "true",
      },
    });
    assertEquals(res.status, 200);
    const html = await res.text();

    // Partial response MUST NOT include the full layout skeleton
    assertEquals(html.includes("<!DOCTYPE html>"), false, `Route ${route} should not contain doctype`);
    assertEquals(html.includes("<html"), false, `Route ${route} should not contain <html>`);
    assertEquals(html.includes("<head>"), false, `Route ${route} should not contain <head>`);
    assertEquals(html.includes("data-client-nav="), false, `Route ${route} should not contain body client-nav`);

    // But it MUST include the title tag and partial-main container
    assertMatch(html, /<title>/, `Route ${route} should include <title>`);
    assertMatch(html, /data-partial="main"/, `Route ${route} should include data-partial="main"`);
  }
});

Deno.test("Partials - Runtime script includes script execution, custom events, and form navigation", async () => {
  const res = await app.request("/");
  const html = await res.text();

  // Verify script execution mechanism for dynamic partial swaps
  assertMatch(html, /executeScripts/);
  assertMatch(html, /replaceChild/);

  // Verify custom event dispatching
  assertMatch(html, /dispatchNavEvent/);
  assertMatch(html, /new CustomEvent/);

  // Verify exposed navigation helpers
  assertMatch(html, /window\.honoNavigate/);

  // Verify f-partial attribute detection
  assertMatch(html, /f-partial/);

  // Verify form submission interception
  assertMatch(html, /form\.getAttribute\('f-client-nav'\)/);
});

