/**
 * page.tsx — Admin source management page.
 *
 * PRD §6: Source management table with status badges.
 */

import { verifyAdminSession } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { sources, categories } from "@/lib/db/schema";

export default async function SourcesPage() {
  await verifyAdminSession();

  const allSources = await db.select().from(sources);
  const allCategories = await db.select().from(categories);

  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-editorial text-3xl font-[800] text-paper-50">
          Sources
        </h1>
        <p className="mt-2 font-ui text-sm text-paper-300">
          Manage RSS/Atom/JSON sources
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-700">
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
                Name
              </th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
                Feed URL
              </th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
                Category
              </th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
                Status
              </th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
                Failures
              </th>
            </tr>
          </thead>
          <tbody>
            {allSources.map((source) => (
              <tr key={source.id} className="border-b border-ink-800">
                <td className="py-3 px-4 font-ui text-sm text-paper-200">
                  {source.name}
                </td>
                <td className="py-3 px-4 font-ui text-sm text-paper-400 truncate max-w-xs">
                  {source.feedUrl}
                </td>
                <td className="py-3 px-4 font-ui text-sm text-paper-400">
                  {source.categoryId ? categoryMap.get(source.categoryId)?.name || "—" : "—"}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge isActive={source.isActive} />
                </td>
                <td className="py-3 px-4 font-mono text-sm text-paper-400">
                  {source.failureCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase ${
        isActive
          ? "bg-dispatch-sage/20 text-dispatch-sage"
          : "bg-dispatch-ember/20 text-dispatch-ember"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-dispatch-sage" : "bg-dispatch-ember"
        }`}
      />
      {isActive ? "Active" : "Paused"}
    </span>
  );
}
