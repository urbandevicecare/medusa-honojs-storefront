import { marked } from "marked";

export interface NewsPost {
  slug: string;
  title: string;
  date: Date;
  snippet: string;
  content: string;
  views: number;
  image?: string;
  category?: string;
}

export function extractFrontMatter<T extends Record<string, any> = Record<string, any>>(raw: string): { attrs: T; body: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { attrs: {} as T, body: raw };
  }

  // Handle both CRLF and LF
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { attrs: {} as T, body: raw };
  }

  const yamlContent = match[1];
  const body = match[2].trimStart();

  const attrs: Record<string, any> = {};
  for (const line of yamlContent.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;
    const colonIdx = trimmedLine.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmedLine.slice(0, colonIdx).trim();
    let val = trimmedLine.slice(colonIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    attrs[key] = val;
  }

  return { attrs: attrs as T, body };
}

export const extract = extractFrontMatter;

let metadataCache: Omit<NewsPost, "content" | "views">[] | null = null;
const memoryViews = new Map<string, number>();

// Embedded fallback articles for edge runtimes (e.g. Cloudflare Workers without filesystem)
const embeddedPosts: Record<string, string> = {
  "apple-siri-ai": `---
title: Apple Unveils Major Siri AI Makeover at WWDC 2026
date: 2026-06-08
category: LATEST
image: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?auto=format&fit=crop&q=80&w=1600&h=900"
snippet: Apple has officially transformed Siri into a fluid, intelligent companion powered by the next generation of Apple Intelligence and Google's Gemini model.
---

At its Worldwide Developers Conference (WWDC) on June 8, 2026, Apple officially
unveiled the much-anticipated **Siri AI**, a major transformation of its voice
assistant powered by the next generation of Apple Intelligence.

Gone are the days of rigid, preprogrammed responses. The new Siri acts as a
fluid, intelligent companion capable of performing tasks across both native and
third-party apps—from drafting emails and sending texts to managing calendar
events using natural language.

### Deep Contextual & Visual Intelligence

One of the most impressive updates is Siri's deep contextual awareness. It can
seamlessly pull from your personal context—including emails, messages, calendar
events, contacts, and notes—to provide incredibly helpful, personalized
responses.

Furthermore, a new "Visual Intelligence" feature allows Siri to "see" and
understand content on your screen or through your camera. Need to split a dinner
bill or identify an object in front of you? Just point your camera, and Siri
will handle the rest.

### Redesigned Experience & Gemini Integration

Siri now boasts a redesigned interface that integrates seamlessly into the
iPhone's Dynamic Island, offering a new "Search or Ask" experience. It also
features a dedicated app, allowing users to easily revisit past conversations.

Notably, Apple has partnered with Google to bolster Siri's capabilities by
integrating the Gemini AI model, significantly expanding its knowledge base and
reasoning skills.

### Availability

Siri AI is built with privacy at its core, utilizing a mix of on-device
processing and "Private Cloud Compute". It is currently available for developer
testing and will roll out to the public with the release of iOS 27 this fall.
(Note: Due to regulatory challenges, these features will experience regional
delays in the European Union and mainland China).`,

  "iphone-battery-guide": `---
title: How to Maximize Your iPhone Battery Life
date: 2026-06-05
category: GUIDES
image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1600&h=900"
snippet: Battery draining too fast? Follow our definitive guide on tweaking settings to get the most out of your iPhone's battery.
---

We see countless iPhones come into the shop with degraded batteries. While
lithium-ion batteries naturally degrade over time, your charging habits play a
huge role.

Here are our top tips:

1. Avoid deep discharges (don't let it hit 0% often).
2. Keep it out of extreme heat.
3. Turn on Optimized Battery Charging.

Read the full guide below to see which background settings you should
immediately turn off.`,

  "m4-macbook-review": `---
title: The M4 MacBook Pro is Finally Here
date: 2026-06-01
category: REVIEWS
image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1600&h=900"
snippet: We take a deep dive into the latest M4 chip architecture and see if it's really worth the upgrade from the M1.
---

The M4 MacBook Pro is finally here, and it's a beast. In our comprehensive
review, we put it through its paces in video rendering, compiling, and battery
life tests.

Is it worth the upgrade? If you're on an Intel Mac, absolutely. If you're on an
M1, the answer is slightly more nuanced, but the performance gains in multi-core
workloads are undeniable.

Stay tuned for our teardown video next week where we see how repairable this new
machine really is.`,

  "store-expansion": `---
title: We are opening a second location!
date: 2026-06-08
category: STORE
image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=1600&h=900"
snippet: Thanks to your incredible support, we are opening a brand new repair center in the downtown district.
---

We couldn't have done it without you. After 5 years in our current location,
we're expanding!

Our new downtown repair center will feature a dedicated waiting lounge with free
coffee, faster turnaround times for screen repairs, and a larger showroom for
refurbished devices.

Join us for the grand opening next month and get 20% off all accessories.`
};

async function readPostRaw(slug: string): Promise<string | null> {
  // 1. Try Deno filesystem
  if (typeof (globalThis as any).Deno?.readTextFile === "function") {
    try {
      return await (globalThis as any).Deno.readTextFile(`./news/${slug}.md`);
    } catch {}
  }
  // 2. Fallback to embedded
  return embeddedPosts[slug] || null;
}

export async function getPosts(): Promise<Omit<NewsPost, "content" | "views">[]> {
  if (metadataCache) return metadataCache;

  const slugs = Object.keys(embeddedPosts);

  // If Deno is available, read directory
  if (typeof (globalThis as any).Deno?.readDir === "function") {
    try {
      for await (const dirEntry of (globalThis as any).Deno.readDir("./news")) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".md")) {
          const s = dirEntry.name.replace(".md", "");
          if (!slugs.includes(s)) slugs.push(s);
        }
      }
    } catch {}
  }

  const posts: Omit<NewsPost, "content" | "views">[] = [];
  for (const slug of slugs) {
    const raw = await readPostRaw(slug);
    if (!raw) continue;
    try {
      const { attrs } = extract<{
        title?: string;
        date?: string;
        snippet?: string;
        image?: string;
        category?: string;
      }>(raw);

      posts.push({
        slug,
        title: attrs.title || "Untitled",
        date: new Date(attrs.date || Date.now()),
        snippet: attrs.snippet || "",
        image: attrs.image,
        category: attrs.category ? attrs.category.toUpperCase() : "NEWS",
      });
    } catch {}
  }

  posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  metadataCache = posts;
  return posts;
}

export async function getPost(slug: string, env?: any): Promise<NewsPost | null> {
  const raw = await readPostRaw(slug);
  if (!raw) return null;

  try {
    const { attrs, body } = extract<{
      title?: string;
      date?: string;
      snippet?: string;
      image?: string;
      category?: string;
    }>(raw);

    const content = await marked.parse(body);

    // Get views from Cloudflare KV, Deno KV, or memory
    let views = 0;
    const cfKv = env?.CACHE_KV || env?.KV;
    if (cfKv && typeof cfKv.get === "function") {
      try {
        const v = await cfKv.get(`news_views:${slug}`);
        views = parseInt(v || "0", 10);
      } catch {}
    } else if (typeof (globalThis as any).Deno?.openKv === "function") {
      try {
        const kv = await (globalThis as any).Deno.openKv("./news_views.db");
        const res = await kv.get(["news_views", slug]);
        views = (res.value as number) || 0;
      } catch {}
    } else {
      views = memoryViews.get(slug) || 0;
    }

    return {
      slug,
      title: attrs.title || "Untitled",
      date: new Date(attrs.date || Date.now()),
      snippet: attrs.snippet || "",
      content,
      views,
      image: attrs.image,
      category: attrs.category ? attrs.category.toUpperCase() : "NEWS",
    };
  } catch {
    return null;
  }
}

export async function incrementViews(slug: string, env?: any): Promise<void> {
  const cfKv = env?.CACHE_KV || env?.KV;
  if (cfKv && typeof cfKv.get === "function" && typeof cfKv.put === "function") {
    try {
      const v = await cfKv.get(`news_views:${slug}`);
      const count = parseInt(v || "0", 10) + 1;
      await cfKv.put(`news_views:${slug}`, String(count));
    } catch {}
    return;
  }

  if (typeof (globalThis as any).Deno?.openKv === "function") {
    try {
      const kv = await (globalThis as any).Deno.openKv("./news_views.db");
      const key = ["news_views", slug];
      const res = await kv.get(key);
      await kv.set(key, ((res.value as number) || 0) + 1);
    } catch {}
    return;
  }

  memoryViews.set(slug, (memoryViews.get(slug) || 0) + 1);
}
