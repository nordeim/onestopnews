/**
 * SummariesData.tsx — Server Component for admin summary review queue.
 *
 * Fetches flagged summaries and renders the review table.
 * Wrapped in <Suspense> by the parent page to prevent blocking-route
 * errors in Next.js 16 with cacheComponents enabled.
 */

import { verifyAdminSession } from "@/lib/auth/dal";
import { getFlaggedSummaries } from "@/features/summaries/queries";

export async function SummariesData() {
  await verifyAdminSession();

  const flaggedSummaries = await getFlaggedSummaries();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-ink-700">
            <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
              Article
            </th>
            <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
              Flag Reason
            </th>
            <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
              Model
            </th>
            <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
              Generated
            </th>
            <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-paper-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {flaggedSummaries.map((summary) => (
            <tr key={summary.id} className="border-b border-ink-800">
              <td className="py-3 px-4 font-ui text-sm text-paper-200 max-w-xs truncate">
                {summary.articleTitle}
              </td>
              <td className="py-3 px-4 font-ui text-sm text-paper-400">
                {summary.flagReason || "—"}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-paper-400">
                {summary.model}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-paper-400">
                {summary.generatedAt?.toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-xs font-medium bg-dispatch-sage/20 text-dispatch-sage hover:bg-dispatch-sage/30 transition-colors"
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1 text-xs font-medium bg-dispatch-ember/20 text-dispatch-ember hover:bg-dispatch-ember/30 transition-colors"
                    type="button"
                  >
                    Disable
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {flaggedSummaries.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center font-mono text-[11px] uppercase tracking-widest text-paper-400"
              >
                No summaries pending review
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
