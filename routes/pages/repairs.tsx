import { Hono } from "hono";
import { STORE_NAME, type AppEnv } from "../../lib/utils.ts";
import { renderPage } from "../../lib/render.tsx";
import { Partial } from "../../components/Partial.tsx";

export const repairsPages = new Hono<AppEnv>();

// 1. My Repairs Overview (/repairs)
repairsPages.get("/repairs", (c) => {
  const state = c.get("state") || {};
  state.title = `My Repairs | ${STORE_NAME}`;

  const content = (
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Partial name="repair-content" id="partial-repair-content">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Repairs
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Manage your device repair requests and active service tickets.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a
              href="/repairs/track"
              class="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Track Ticket
            </a>
            <a
              href="/repairs/book"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
            >
              Book New Repair
            </a>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-gray-900 mb-2">No Active Repair Tickets</h2>
          <p class="text-gray-500 text-sm max-w-md mx-auto mb-6">
            If you recently dropped off a Mac or mailed in a device, use the tracking tool or book a repair.
          </p>
          <a
            href="/repairs/book"
            class="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
          >
            Start a Repair Booking
          </a>
        </div>
      </Partial>
    </div>
  );

  return renderPage(c, content, state);
});

// 2. Book a Repair (/repairs/book)
repairsPages.get("/repairs/book", (c) => {
  const state = c.get("state") || {};
  state.title = `Book a Repair | ${STORE_NAME}`;

  const content = (
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Partial name="repair-content" id="partial-repair-content">
        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
            Book a Device Repair
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Fill out your device and issue details below to create an intake ticket.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form id="book-repair-form" class="space-y-6">
            <div class="space-y-4">
              <h2 class="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                1. Customer Information
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  required
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  required
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  required
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                2. Device & Issue
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <select
                  name="device_model"
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Device...</option>
                  <option value="MacBook Pro">MacBook Pro</option>
                  <option value="MacBook Air">MacBook Air</option>
                  <option value="iMac">iMac</option>
                  <option value="Mac Mini / Studio">Mac Mini / Studio</option>
                  <option value="iPhone / iPad">iPhone / iPad</option>
                </select>
                <input
                  type="text"
                  name="serial_number"
                  placeholder="Serial Number (Optional)"
                  class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                name="issue_description"
                rows={4}
                placeholder="Describe the issue you are experiencing (e.g., liquid damage, battery swelling, screen cracked)..."
                required
                class="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              id="submit-booking-btn"
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              Submit Repair Request
            </button>
          </form>
        </div>
      </Partial>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('book-repair-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('submit-booking-btn');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      var formData = new FormData(form);
      var payload = Object.fromEntries(formData.entries());

      try {
        var res = await fetch('/api/repairs/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (res.ok) {
          if (window.showToast) window.showToast('Repair ticket created successfully!');
          var ticketNum = data.ticket?.ticket_number || data.id || '';
          setTimeout(function() {
            window.location.href = '/repairs/track?ticket=' + encodeURIComponent(ticketNum);
          }, 800);
        } else {
          if (window.showToast) window.showToast(data.error || 'Failed to submit repair', true);
          btn.disabled = false;
          btn.textContent = 'Submit Repair Request';
        }
      } catch(err) {
        if (window.showToast) window.showToast('Connection error', true);
        btn.disabled = false;
        btn.textContent = 'Submit Repair Request';
      }
    });
  }
})();
`,
        }}
      />
    </div>
  );

  return renderPage(c, content, state);
});

// 3. Track a Repair (/repairs/track)
repairsPages.get("/repairs/track", (c) => {
  const state = c.get("state") || {};
  const ticketParam = c.req.query("ticket") || c.req.query("serial") || "";
  state.title = `Track Your Repair | ${STORE_NAME}`;

  const content = (
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Partial name="repair-content" id="partial-repair-content">
        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Repair Status
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Check the real-time status of your device repair ticket.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          <form id="track-form" class="flex gap-3">
            <input
              type="text"
              id="ticket-input"
              defaultValue={ticketParam}
              placeholder="Enter Ticket # or Device Serial Number"
              required
              class="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              id="track-submit-btn"
              class="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition cursor-pointer"
            >
              Track
            </button>
          </form>

          <div id="track-result" class="pt-4 border-t border-gray-100 hidden">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Ticket Status
                </span>
                <h3 class="text-lg font-bold text-gray-900" id="result-ticket-title"></h3>
              </div>
              <span id="result-status-badge" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800">
              </span>
            </div>

            <div class="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              <p><strong>Device:</strong> <span id="result-device"></span></p>
              <p><strong>Issue:</strong> <span id="result-issue"></span></p>
              <p><strong>Last Updated:</strong> <span id="result-date"></span></p>
            </div>
          </div>
        </div>
      </Partial>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('track-form');
  var input = document.getElementById('ticket-input');
  var resultBox = document.getElementById('track-result');
  var titleEl = document.getElementById('result-ticket-title');
  var badgeEl = document.getElementById('result-status-badge');
  var deviceEl = document.getElementById('result-device');
  var issueEl = document.getElementById('result-issue');
  var dateEl = document.getElementById('result-date');

  async function lookup(ticket) {
    if (!ticket) return;
    try {
      var res = await fetch('/api/repairs/track?ticket=' + encodeURIComponent(ticket));
      var data = await res.json();
      if (res.ok && data) {
        var t = data.ticket || data;
        resultBox.classList.remove('hidden');
        titleEl.textContent = 'Ticket #' + (t.ticket_number || ticket);
        badgeEl.textContent = t.status || 'In Progress';
        deviceEl.textContent = t.device_model || 'Device';
        issueEl.textContent = t.issue_description || 'Diagnostic check';
        dateEl.textContent = new Date(t.updated_at || Date.now()).toLocaleDateString();
      } else {
        if (window.showToast) window.showToast('No ticket found matching query', true);
      }
    } catch(err) {
      if (window.showToast) window.showToast('Error looking up ticket', true);
    }
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      lookup(input.value.trim());
    });
  }

  var initialTicket = "${ticketParam}";
  if (initialTicket) {
    lookup(initialTicket);
  }
})();
`,
        }}
      />
    </div>
  );

  return renderPage(c, content, state);
});
