import { LOGO_URL, STORE_NAME } from "../lib/utils.ts";

export function Header({
  categories = [],
  isLoggedIn = false,
  isRepairModuleInstalled = false,
  storeName,
  logoUrl,
}: {
  categories?: any[];
  isLoggedIn?: boolean;
  isRepairModuleInstalled?: boolean;
  storeName?: string;
  logoUrl?: string;
}) {
  const maxCategories = categories.slice(0, 4);
  const currentLogo = logoUrl || LOGO_URL;
  const currentName = storeName || STORE_NAME;

  return (
    <header class="w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex-shrink-0 flex items-center h-full">
            <a href="/" class="flex items-center h-full">
              <img
                src={currentLogo}
                alt={`${currentName} Logo`}
                class="h-16 w-auto object-contain"
              />
            </a>
          </div>

          <nav class="hidden md:flex space-x-8">
            <a
              href="/"
              class="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            >
              Store
            </a>
            {maxCategories.map((category: any) => (
              <a
                key={category.id || category.handle}
                href={`/shop/${category.handle}`}
                class="text-gray-900 font-medium hover:text-slate-600 capitalize transition-colors"
              >
                {category.name}
              </a>
            ))}
            <a
              href="/news"
              class="text-gray-900 font-medium hover:text-slate-600 capitalize transition-colors"
            >
              News
            </a>
          </nav>

          <div class="flex items-center space-x-4">
            <div class="relative group">
              <a
                href="/account"
                class="text-gray-600 hover:text-gray-900 flex items-center h-full py-2 transition-colors"
                aria-label="User Account"
              >
                <svg
                  class={`w-5 h-5 ${isLoggedIn ? "text-blue-600" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </a>

              {isLoggedIn && (
                <div class="absolute right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-sm">
                  <div class="bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden flex flex-col py-1.5 w-48">
                    <a
                      href="/account"
                      class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/account/orders"
                      class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      My Orders
                    </a>
                    {isRepairModuleInstalled && (
                      <>
                        <a
                          href="/repairs"
                          class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          My Repairs
                        </a>
                        <a
                          href="/repairs/book"
                          class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          Book a Repair
                        </a>
                      </>
                    )}
                    <div class="h-px bg-gray-100 my-1" />
                    <a
                      href="/api/auth/logout"
                      class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a
              href="/cart"
              class="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Shopping Cart"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
