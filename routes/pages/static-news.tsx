import { Hono } from "hono";
import { STORE_NAME, STORE_DOMAIN, type AppEnv } from "../../lib/utils.ts";
import { getPosts, getPost, incrementViews } from "../../lib/news.ts";
import { getMedusaBackendUrl } from "../../lib/sdk.ts";
import { renderPage } from "../../lib/render.tsx";

export const staticNewsPages = new Hono<AppEnv>();

// --- NEWS ROUTES ---
staticNewsPages.get("/news", async (c) => {
  const state = c.get("state") || {};
  state.title = `Tech News & Insights | ${STORE_NAME}`;
  state.description = "Latest updates, guides, and Apple silicon breakthroughs.";

  const posts = await getPosts();

  const content = (
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div class="mb-10 text-center max-w-2xl mx-auto">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">
          News & Insights
        </h1>
        <p class="text-base text-gray-500 mt-2">
          Discover repair guides, tech news, and hardware analysis from our expert technicians.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/news/${post.slug}`}
            class="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
          >
            {post.image && (
              <div class="aspect-video w-full overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt={post.title}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div class="p-6 flex flex-col flex-1">
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                {post.category || "NEWS"}
              </span>
              <h2 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                {post.title}
              </h2>
              <p class="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                {post.snippet}
              </p>
              <div class="text-xs text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );

  return renderPage(c, content, state);
});

staticNewsPages.get("/news/:slug", async (c) => {
  const state = c.get("state") || {};
  const slug = c.req.param("slug");

  const post = await getPost(slug, c.env);
  if (!post) {
    return c.notFound();
  }

  incrementViews(slug, c.env).catch(() => {});

  state.title = `${post.title} | ${STORE_NAME}`;
  state.description = post.snippet;

  const content = (
    <main class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div class="mb-8">
        <a href="/news" class="text-xs font-semibold text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to News
        </a>
        <span class="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
          {post.category}
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span>{new Date(post.date).toLocaleDateString()}</span>
          <span>&bull;</span>
          <span>{post.views} views</span>
        </div>
      </div>

      {post.image && (
        <div class="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img src={post.image} alt={post.title} class="w-full object-cover max-h-[450px]" />
        </div>
      )}

      <article
        class="prose prose-slate max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );

  return renderPage(c, content, state);
});

// --- SHORTENER PROXY (/r/:code) ---
staticNewsPages.get("/r/:code", async (c) => {
  const code = c.req.param("code");
  const backendUrl = getMedusaBackendUrl(c.env).replace(/\/$/, "");

  try {
    const res = await fetch(`${backendUrl}/api/store/repairs/r/${code}`, {
      redirect: "manual",
    });

    if ([301, 302, 307, 308].includes(res.status)) {
      const location = res.headers.get("Location");
      if (location) {
        return c.redirect(location, 302);
      }
    }
  } catch (e) {
    console.error("Shortlink redirect error:", e);
  }

  return c.text("Link not found", 404);
});

// --- ABOUT PAGES ---
staticNewsPages.get("/about/our-story", (c) => {
  const state = c.get("state") || {};
  state.title = `Our Story - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Our Story</h1>
      <div class="prose prose-slate max-w-none leading-relaxed space-y-4 text-gray-700">
        <p>
          Founded with a mission to eliminate electronic waste and make premium Apple hardware accessible,
          {STORE_NAME} provides certified refurbished devices backed by industry-leading hardware warranties.
        </p>
        <p>
          Every device is rigorously tested across a 32-point diagnostic matrix by certified technicians before being certified for sale.
        </p>
      </div>
    </main>,
    state,
  );
});

staticNewsPages.get("/about/careers", (c) => {
  const state = c.get("state") || {};
  state.title = `Careers - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Join Our Team</h1>
      <p class="text-gray-600 mb-4">
        We are always seeking passionate micro-soldering technicians, refurbished hardware specialists, and customer care champions.
      </p>
      <div class="p-6 bg-white border border-gray-200 rounded-xl">
        <h3 class="font-bold text-gray-900">Mac & Logic Board Technician</h3>
        <p class="text-sm text-gray-500 mt-1">Full-Time &bull; London / On-Site</p>
        <p class="text-sm text-gray-600 mt-3">
          Interested candidates can send CVs directly to careers@{STORE_DOMAIN}.
        </p>
      </div>
    </main>,
    state,
  );
});

staticNewsPages.get("/about/contact", (c) => {
  const state = c.get("state") || {};
  state.title = `Contact Us - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Contact Us</h1>
      <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Email</h3>
          <p class="text-gray-600 text-sm mt-0.5">support@{STORE_DOMAIN}</p>
        </div>
        <div class="border-t border-gray-100 pt-4">
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Headquarters</h3>
          <p class="text-gray-600 text-sm mt-0.5">Urban Device Care, High Street, London, UK</p>
        </div>
      </div>
    </main>,
    state,
  );
});

// --- SERVICES PAGES ---
staticNewsPages.get("/services/repairs", (c) => {
  const state = c.get("state") || {};
  state.title = `Device Repairs - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Mac & iPhone Repair Services</h1>
      <p class="text-gray-600 mb-8 leading-relaxed">
        From screen replacements to board-level micro-soldering and liquid damage recovery, our lab handles complex hardware repairs.
      </p>
      <div class="flex gap-4">
        <a href="/repairs/book" class="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition">
          Book Repair
        </a>
        <a href="/repairs/track" class="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
          Track Repair
        </a>
      </div>
    </main>,
    state,
  );
});

staticNewsPages.get("/services/guides", (c) => {
  const state = c.get("state") || {};
  state.title = `DIY Guides - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">DIY Repair Guides</h1>
      <p class="text-gray-600 leading-relaxed">
        We support the right to repair. Browse step-by-step tear-downs, battery swap instructions, and maintenance tips.
      </p>
    </main>,
    state,
  );
});

staticNewsPages.get("/services/trade-in", (c) => {
  const state = c.get("state") || {};
  state.title = `Trade-in Program - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Trade-in Your Device</h1>
      <p class="text-gray-600 leading-relaxed">
        Upgrade to a newer Mac or iPhone while getting instant store credit for your old hardware.
      </p>
    </main>,
    state,
  );
});

staticNewsPages.get("/services/financing", (c) => {
  const state = c.get("state") || {};
  state.title = `Device Financing - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Flexible Payment Plans</h1>
      <p class="text-gray-600 leading-relaxed">
        Spread the cost of your refurbished Apple equipment with interest-free installment options.
      </p>
    </main>,
    state,
  );
});

// --- LEGAL PAGES ---
staticNewsPages.get("/legal/terms", (c) => {
  const state = c.get("state") || {};
  state.title = `Terms of Service - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Terms of Service</h1>
      <p>By using {STORE_NAME}, you agree to our standard terms of purchase, warranty coverage, and repair conditions.</p>
    </main>,
    state,
  );
});

staticNewsPages.get("/legal/privacy", (c) => {
  const state = c.get("state") || {};
  state.title = `Privacy Policy - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Privacy Policy</h1>
      <p>We respect customer confidentiality. Your personal information and device data are protected with strict security safeguards.</p>
    </main>,
    state,
  );
});

staticNewsPages.get("/legal/cookies", (c) => {
  const state = c.get("state") || {};
  state.title = `Cookie Policy - ${STORE_NAME}`;
  return renderPage(
    c,
    <main class="flex-1 max-w-4xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Cookie Policy</h1>
      <p>We use essential cookies strictly necessary for shopping cart persistence and session security.</p>
    </main>,
    state,
  );
});
