/**
 * layout.tsx — Admin route group layout.
 *
 * PRD §6: Admin routes protected by verifyAdminSession().
 * Non-admin users are redirected to the home page.
 */

import { verifyAdminSession } from "@/lib/auth/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect non-admin users
  await verifyAdminSession();

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 min-h-screen bg-ink-900 border-r border-ink-700 p-6">
          <h2 className="font-editorial text-lg font-[800] text-paper-50 mb-8">
            OneStopNews
          </h2>
          <ul className="space-y-2">
            <li>
              <a
                href="/admin/sources"
                className="block px-3 py-2 font-ui text-sm text-paper-300 hover:text-dispatch-ember transition-colors"
              >
                Sources
              </a>
            </li>
            <li>
              <a
                href="/admin/summaries"
                className="block px-3 py-2 font-ui text-sm text-paper-300 hover:text-dispatch-ember transition-colors"
              >
                Summaries
              </a>
            </li>
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
