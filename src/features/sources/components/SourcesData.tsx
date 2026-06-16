/**
 * SourcesData.tsx — Server Component for fetching source list.
 *
 * Separates data fetching from the page to enable <Suspense> wrapping
 * in Next.js 16 with cacheComponents enabled.
 */

import { verifyAdminSession } from "@/lib/auth/dal";
import { getAllSources, getCategoryMap } from "@/features/sources/queries";

/** Source item as returned by the database query. */
interface SourceRow {
  id: string;
  name: string;
  feedUrl: string | null;
  categoryId: string | null;
  isActive: boolean;
  failureCount: number;
}

function SourceTable({ sources, categoryMap }: { sources: SourceRow[]; categoryMap: Record<string, string> }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-ink-700">
          <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">Name</th>
          <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">Feed URL</th>
          <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">Category</th>
          <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">Status</th>
          <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">Failures</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((source) => (
          <tr key={source.id} className="border-b border-ink-800">
            <td className="py-3 px-4 font-ui text-sm text-paper-200">{source.name}</td>
            <td className="py-3 px-4 font-ui text-sm text-paper-400 truncate max-w-xs">{source.feedUrl}</td>
            <td className="py-3 px-4 font-ui text-sm text-paper-400">{source.categoryId ? categoryMap[source.categoryId] || "—" : "—"}</td>
            <td className="py-3 px-4">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase ${source.isActive ? "bg-dispatch-sage/20 text-dispatch-sage" : "bg-dispatch-ember/20 text-dispatch-ember"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${source.isActive ? "bg-dispatch-sage" : "bg-dispatch-ember"}`} />
                {source.isActive ? "Active" : "Paused"}
              </span>
            </td>
            <td className="py-3 px-4 font-mono text-sm text-paper-400">{source.failureCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export async function SourcesData() {
  await verifyAdminSession();

  const sources = await getAllSources();
  const categoryMap = await getCategoryMap();

  return <SourceTable sources={sources} categoryMap={categoryMap} />;
}
