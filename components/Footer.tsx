import { STORE_NAME } from "../lib/utils.ts";

export function Footer({
  isRepairModuleInstalled = false,
  storeName,
}: {
  isRepairModuleInstalled?: boolean;
  storeName?: string;
}) {
  const currentName = storeName || STORE_NAME;
  return (
    <footer class="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h3 class="font-semibold mb-4 text-gray-900">Shop</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/shop/iphone" class="hover:text-blue-600 transition-colors">
                  iPhone
                </a>
              </li>
              <li>
                <a href="/shop/mac" class="hover:text-blue-600 transition-colors">
                  Mac
                </a>
              </li>
              <li>
                <a href="/shop/ipad" class="hover:text-blue-600 transition-colors">
                  iPad
                </a>
              </li>
              <li>
                <a href="/shop/watch" class="hover:text-blue-600 transition-colors">
                  Watch
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold mb-4 text-gray-900">Services</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              {isRepairModuleInstalled && (
                <li>
                  <a href="/services/repairs" class="hover:text-blue-600 transition-colors">
                    Repairs
                  </a>
                </li>
              )}
              <li>
                <a href="/services/guides" class="hover:text-blue-600 transition-colors">
                  DIY Guides
                </a>
              </li>
              <li>
                <a href="/services/trade-in" class="hover:text-blue-600 transition-colors">
                  Trade-in
                </a>
              </li>
              <li>
                <a href="/services/financing" class="hover:text-blue-600 transition-colors">
                  Financing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold mb-4 text-gray-900">About</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/about/our-story" class="hover:text-blue-600 transition-colors">
                  Our Story
                </a>
              </li>
              <li>
                <a href="/about/careers" class="hover:text-blue-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/about/contact" class="hover:text-blue-600 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/news" class="hover:text-blue-600 transition-colors">
                  News
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold mb-4 text-gray-900">Support</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/repairs/track" class="hover:text-blue-600 transition-colors">
                  Track Repair
                </a>
              </li>
              <li>
                <a href="/repairs/book" class="hover:text-blue-600 transition-colors">
                  Book Repair
                </a>
              </li>
              <li>
                <a href="/account" class="hover:text-blue-600 transition-colors">
                  My Account
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold mb-4 text-gray-900">Legal</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/legal/terms" class="hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/legal/privacy" class="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/legal/cookies" class="hover:text-blue-600 transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {currentName}. All rights reserved.</p>
          <p class="mt-4 md:mt-0">Refurbished tech with warranty & care.</p>
        </div>
      </div>
    </footer>
  );
}
