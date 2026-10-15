import type { StoreState } from "../lib/utils.ts";

export function AccountLayout({
  children,
  activeTab = "overview",
  state = {},
}: {
  children?: any;
  activeTab?: "overview" | "orders" | "addresses" | "profile" | "repairs";
  state?: StoreState;
}) {
  const tabs = [
    { id: "overview", label: "Overview", href: "/account" },
    { id: "orders", label: "My Orders", href: "/account/orders" },
    { id: "addresses", label: "Addresses", href: "/account/addresses" },
    { id: "profile", label: "Profile", href: "/account/profile" },
  ];

  if (state.isRepairModuleInstalled || state.hasRepairs) {
    tabs.push({ id: "repairs", label: "My Repairs", href: "/repairs" });
  }

  return (
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl font-bold mb-8">My Account</h1>
      <div class="flex flex-col md:flex-row gap-8">
        <aside class="w-full md:w-64 shrink-0">
          <nav class="flex flex-col space-y-1 bg-white p-4 rounded-xl border border-gray-200">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={tab.href}
                class={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </a>
            ))}
            <div class="h-px bg-gray-100 my-2" />
            <a
              href="/api/auth/logout"
              class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sign Out
            </a>
          </nav>
        </aside>

        <section class="flex-1 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
          {children}
        </section>
      </div>
    </main>
  );
}
