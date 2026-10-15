import { STORE_NAME, type StoreState } from "../lib/utils.ts";
import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import { Partial } from "./Partial.tsx";
import { TopProgressBar } from "./TopProgressBar.tsx";
import { html } from "hono/html";

export function Layout({
  children,
  state = {},
  title,
  description,
}: {
  children?: any;
  state?: StoreState;
  title?: string;
  description?: string;
}) {
  const storeName = state.storeName || STORE_NAME;
  const pageTitle =
    title ||
    state.title ||
    `${storeName} - More than a Mac Repair Shop`;
  const pageDescription =
    description ||
    state.description ||
    "Discover certified refurbished devices and unbeatable prices on both new and pre-owned Apple products.";

  return (
    <>
      {html`<!DOCTYPE html>`}
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="view-transition" content="same-origin" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body
        data-client-nav="true"
        class={`min-h-screen bg-[#F6F7F8] font-sans text-gray-900 flex flex-col ${
          state?.hideLayout ? "print:bg-white bg-white" : ""
        }`}
      >
        <TopProgressBar />

        {!state?.hideLayout && (
          <Header
            categories={state?.categories || []}
            isLoggedIn={!!state?.isLoggedIn}
            isRepairModuleInstalled={!!state?.isRepairModuleInstalled}
            storeName={state?.storeName}
            logoUrl={state?.logoUrl}
          />
        )}

        <Partial name="main" id="partial-main" class="flex-1 flex flex-col">
          {children}
        </Partial>

        {!state?.hideLayout && (
          <Footer
            isRepairModuleInstalled={!!state?.isRepairModuleInstalled}
            storeName={state?.storeName}
          />
        )}

        {/* Global Toast Container for Ratings & Notifications */}
        <div
          id="global-toast"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-in-out opacity-0 translate-y-4 pointer-events-none"
        >
          <div
            id="global-toast-msg"
            class="bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium tracking-wide whitespace-nowrap"
          >
          </div>
        </div>

        {/* Client Navigation, Partials & Star Rating Interactivity Runtime */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function showToast(message, isError) {
    var toast = document.getElementById('global-toast');
    var msg = document.getElementById('global-toast-msg');
    if (!toast || !msg) return;
    msg.textContent = message;
    if (isError) {
      msg.className = "bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium tracking-wide whitespace-nowrap";
    } else {
      msg.className = "bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium tracking-wide whitespace-nowrap";
    }
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(function() {
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3200);
  }
  window.showToast = showToast;

  // Star Rating Initialization
  function initStarRatings() {
    var widgets = document.querySelectorAll('.star-rating-widget');
    widgets.forEach(function(widget) {
      if (widget.__initialized) return;
      widget.__initialized = true;

      var productId = widget.getAttribute('data-product-id');
      var interactive = widget.getAttribute('data-interactive') === 'true';
      if (!interactive || !productId) return;

      var stars = widget.querySelectorAll('.star-btn');
      var starsContainer = widget.querySelector('[data-rating-container]');
      var ratingText = widget.querySelector('.rating-text');
      var isSubmitting = false;

      function renderStars(activeRating) {
        var currentAvg = parseFloat(widget.getAttribute('data-average')) || 0;
        var userR = widget.getAttribute('data-user-rating');
        var effective = activeRating !== null ? activeRating : (userR ? parseInt(userR) : null);

        stars.forEach(function(btn, idx) {
          var starVal = idx + 1;
          var fill = btn.querySelector('.star-fill');
          if (!fill) return;

          var pct = 0;
          if (effective !== null) {
            pct = starVal <= effective ? 100 : 0;
          } else if (currentAvg >= starVal) {
            pct = 100;
          } else if (currentAvg > starVal - 1) {
            pct = Math.round((currentAvg - (starVal - 1)) * 100);
          }
          fill.style.width = pct + '%';
        });
      }

      stars.forEach(function(btn, idx) {
        var starVal = idx + 1;
        btn.addEventListener('mouseenter', function() {
          if (!isSubmitting) renderStars(starVal);
        });
        btn.addEventListener('focus', function() {
          if (!isSubmitting) renderStars(starVal);
        });
        btn.addEventListener('blur', function() {
          if (!isSubmitting) renderStars(null);
        });

        btn.addEventListener('click', async function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (isSubmitting) return;

          isSubmitting = true;
          stars.forEach(function(b) { b.disabled = true; });

          try {
            var res = await fetch('/api/ratings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: productId, rating: starVal })
            });

            if (res.status === 401) {
              showToast('Please log in to rate', true);
              return;
            }
            if (!res.ok) {
              showToast('Failed to submit rating', true);
              return;
            }

            var data = await res.json();
            widget.setAttribute('data-average', data.average);
            widget.setAttribute('data-count', data.count);
            widget.setAttribute('data-user-rating', starVal);

            if (ratingText) {
              ratingText.innerHTML = data.average.toFixed(1) + '/5 <span class="rating-count">(' + data.count + ')</span>';
            }
            showToast('Rating submitted! Thank you.', false);
            renderStars(null);
          } catch(err) {
            showToast('Error submitting rating', true);
          } finally {
            isSubmitting = false;
            stars.forEach(function(b) { b.disabled = false; });
          }
        });
      });

      if (starsContainer) {
        starsContainer.addEventListener('mouseleave', function() {
          if (!isSubmitting) renderStars(null);
        });
      }
    });
  }
  window.__initStarRatings = initStarRatings;

  // Custom Event Dispatcher
  function dispatchNavEvent(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch(e) {}
  }

  // Script Executor for dynamic partial DOM swaps
  function executeScripts(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function(oldScript) {
      var newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(function(attr) {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // Top Progress Bar Controller
  var progressEl = document.getElementById('top-progress-bar');
  var innerEl = document.getElementById('top-progress-inner');
  var progressTimer = null;
  var progressVal = 0;

  function startProgress() {
    if (!progressEl || !innerEl) return;
    document.body.classList.add('is-navigating');
    progressEl.style.opacity = '1';
    progressVal = 15;
    innerEl.style.width = progressVal + '%';

    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(function() {
      if (progressVal >= 90) return;
      progressVal += (90 - progressVal) * 0.15;
      innerEl.style.width = progressVal + '%';
    }, 180);
  }

  function completeProgress() {
    if (!progressEl || !innerEl) return;
    document.body.classList.remove('is-navigating');
    if (progressTimer) clearInterval(progressTimer);
    progressVal = 100;
    innerEl.style.width = '100%';

    setTimeout(function() {
      progressEl.style.opacity = '0';
      setTimeout(function() {
        innerEl.style.width = '0%';
        progressVal = 0;
      }, 300);
    }, 250);
  }

  window.addEventListener('partial-start', startProgress);
  window.addEventListener('fresh:partial-start', startProgress);
  window.addEventListener('hono:partial-start', startProgress);

  window.addEventListener('partial-end', completeProgress);
  window.addEventListener('fresh:partial-end', completeProgress);
  window.addEventListener('hono:partial-end', completeProgress);

  // Client-Side Navigation and Partials Handler
  async function navigate(url, push, targetedPartial) {
    if (push === undefined) push = true;

    dispatchNavEvent('partial-start', { url: url, partial: targetedPartial });
    dispatchNavEvent('hono:partial-start', { url: url, partial: targetedPartial });
    dispatchNavEvent('fresh:partial-start', { url: url, partial: targetedPartial });

    try {
      var reqHeaders = {
        'X-Hono-Partial': 'true',
        'Accept': 'text/html'
      };
      if (targetedPartial) {
        reqHeaders['X-Partial'] = targetedPartial;
      }

      var res = await fetch(url, { headers: reqHeaders });

      if (!res.ok) {
        window.location.href = url;
        return;
      }

      var text = await res.text();
      var parser = new DOMParser();
      var doc = parser.parseFromString(text, 'text/html');

      var swap = function() {
        if (doc.title) document.title = doc.title;

        var incomingPartials = doc.querySelectorAll('[data-partial]');
        var swapped = false;

        // If a specific partial was targeted, prioritize swapping only that one
        if (targetedPartial) {
          var targetEl = document.querySelector('[data-partial="' + targetedPartial + '"]');
          var incEl = doc.querySelector('[data-partial="' + targetedPartial + '"]') || doc.body;
          if (targetEl && incEl) {
            targetEl.innerHTML = (incEl === doc.body ? text : incEl.innerHTML);
            executeScripts(targetEl);
            swapped = true;
          }
        }

        if (!swapped) {
          incomingPartials.forEach(function(inc) {
            var name = inc.getAttribute('data-partial');
            // Avoid duplicate swap of descendants if main partial is being swapped
            var parentPartial = inc.parentElement ? inc.parentElement.closest('[data-partial]') : null;
            if (parentPartial && parentPartial.getAttribute('data-partial') === 'main') {
              return;
            }
            var target = document.querySelector('[data-partial="' + name + '"]');
            if (target) {
              target.innerHTML = inc.innerHTML;
              executeScripts(target);
              swapped = true;
            }
          });
        }

        if (!swapped) {
          var mainTarget = document.querySelector('[data-partial="main"]');
          var incMain = doc.querySelector('[data-partial="main"]') || doc.body;
          if (mainTarget && incMain) {
            mainTarget.innerHTML = (incMain === doc.body ? text : incMain.innerHTML);
            executeScripts(mainTarget);
          } else {
            window.location.href = url;
            return;
          }
        }

        if (push) {
          history.pushState({ url: url }, '', url);
        }

        initStarRatings();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      if (document.startViewTransition) {
        document.startViewTransition(swap);
      } else {
        swap();
      }
    } catch(e) {
      window.location.href = url;
    } finally {
      dispatchNavEvent('partial-end', { url: url, partial: targetedPartial });
      dispatchNavEvent('hono:partial-end', { url: url, partial: targetedPartial });
      dispatchNavEvent('fresh:partial-end', { url: url, partial: targetedPartial });
    }
  }

  window.honoNavigate = navigate;
  window.navigate = navigate;

  // Intercept Navigation Links
  document.addEventListener('click', function(e) {
    var anchor = e.target.closest('a');
    if (!anchor || !anchor.href) return;

    if (anchor.getAttribute('f-client-nav') === 'false' ||
        anchor.getAttribute('data-client-nav') === 'false' ||
        anchor.hasAttribute('download') ||
        anchor.target === '_blank') {
      return;
    }

    try {
      var targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
        if (targetUrl.hash) return;
      }
      if (targetUrl.pathname.startsWith('/api/') || targetUrl.pathname.match(/\\.(pdf|zip|xml|ico|svg|png|jpg|css|js)$/)) {
        return;
      }

      var fPartial = anchor.getAttribute('f-partial');
      var dataPartial = anchor.getAttribute('data-partial');
      var targetPartial = dataPartial || (fPartial && fPartial !== 'true' && !fPartial.startsWith('/') ? fPartial : undefined);
      var fetchUrl = (fPartial && fPartial.startsWith('/')) ? fPartial : targetUrl.href;

      e.preventDefault();
      navigate(fetchUrl, true, targetPartial);
    } catch(err) {}
  });

  // Intercept Form Submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (form.getAttribute('f-client-nav') === 'false' || form.getAttribute('data-client-nav') === 'false') return;
    if (form.target === '_blank') return;

    var method = (form.method || 'GET').toUpperCase();
    if (method === 'GET') {
      try {
        var actionUrl = new URL(form.action || window.location.href, window.location.href);
        var formData = new FormData(form);
        for (var entry of formData.entries()) {
          actionUrl.searchParams.set(entry[0], entry[1]);
        }
        var fPartial = form.getAttribute('f-partial');
        var dataPartial = form.getAttribute('data-partial');
        var targetPartial = dataPartial || (fPartial && fPartial !== 'true' && !fPartial.startsWith('/') ? fPartial : undefined);

        e.preventDefault();
        navigate(actionUrl.href, true, targetPartial);
      } catch(err) {}
    }
  });

  window.addEventListener('popstate', function() {
    navigate(window.location.href, false);
  });

  // Run on initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarRatings);
  } else {
    initStarRatings();
  }
})();
`,
          }}
        />
      </body>
    </html>
    </>
  );
}
