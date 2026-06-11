import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* ── Wire Ticker ───────────────────────────────────────────── 
          Always-on news pulse at the top of the page.           */}
      <div className="bg-ink-900 text-paper-100 font-mono text-[11px] leading-none overflow-hidden" aria-label="Breaking news ticker">
        <div className="flex items-center whitespace-nowrap py-2.5 gap-10 ticker-track">
          <span className="flex items-center gap-2">
            <span className="text-dispatch-ember font-semibold uppercase tracking-widest">Breaking</span>
            EU Parliament votes on AI Act enforcement framework
          </span>
          <span className="text-paper-200 opacity-20" aria-hidden="true">|</span>
          <span className="flex items-center gap-2">
            <span className="text-dispatch-sage font-semibold uppercase tracking-widest">Finance</span>
            Global markets rally as inflation data cools across G7
          </span>
          <span className="text-paper-200 opacity-20" aria-hidden="true">|</span>
          <span className="flex items-center gap-2">
            <span className="text-dispatch-slate font-semibold uppercase tracking-widest">Tech</span>
            SpaceX Starship completes first orbital refueling test
          </span>
        </div>
      </div>

      {/* ── Masthead ────────────────────────────────────────────── 
          Newspaper-style wordmark with edition bar.            */}
      <header className="border-b border-paper-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 border-b border-paper-100 font-mono text-[11px] text-ink-400">
            <div className="flex items-center gap-4">
              <span className="uppercase tracking-widest">Edition 3.1</span>
              <span className="hidden sm:inline text-paper-300">—</span>
              <span className="hidden sm:inline">Today</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dispatch-ember pulse-dot" aria-hidden="true" />
                <span className="text-dispatch-ember font-medium uppercase tracking-widest">Live</span>
              </span>
            </div>
          </div>
          <div className="py-8 sm:py-12 text-center">
            <h1
              className="font-editorial text-5xl sm:text-6xl lg:text-[5.5rem] font-[800] tracking-[-0.03em] text-ink-900"
              style={{ lineHeight: 0.93, fontFeatureSettings: '"opsz" 72' }}
            >
              OneStopNews
            </h1>
            <p className="mt-3 font-mono text-[11px] text-ink-300 uppercase tracking-[0.35em]">
              Your Briefing Room
            </p>
          </div>
        </div>
      </header>

      {/* ── Category Navigation ─────────────────────────────────── 
          Sticky topic rail (placeholder for dynamic categories). */}
      <nav className="sticky top-0 z-40 bg-paper-50/95 backdrop-blur-sm border-b border-paper-200" aria-label="Topic categories">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2.5 overflow-x-auto category-nav" role="tablist">
            <button
              role="tab"
              aria-selected="true"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 border-dispatch-ember text-ink-900 transition-colors duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-dispatch-ember" aria-hidden="true" />
              Top Stories
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-dispatch-clay" aria-hidden="true" />
              Local
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-dispatch-slate" aria-hidden="true" />
              Tech
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-dispatch-sage" aria-hidden="true" />
              Finance
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-ink-600 hover:text-ink-900 hover:bg-paper-100 transition-colors duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-dispatch-violet" aria-hidden="true" />
              Culture
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero / Lead Story ───────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden bg-paper-200 aspect-[16/9]">
              <Image
                src="https://picsum.photos/seed/eu-ai-act/1200/675"
                alt="European Parliament building during a key legislative session"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-dispatch-ember/95 px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" aria-hidden="true" />
                <span className="font-mono text-[10px] text-white font-semibold uppercase tracking-widest">Breaking</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[46px] font-[800] leading-[1.05] tracking-[-0.03em] text-ink-900">
              The Alignment Problem Is Now a Policy Problem
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-600">
              <span>Reuters, AP, TechCrunch</span>
              <span aria-hidden="true">·</span>
              <span>42 min ago</span>
              <span aria-hidden="true">·</span>
              <span className="text-dispatch-sage">3 sources</span>
            </div>
            <p className="mt-5 text-ink-600 text-[15px] leading-relaxed">
              As the EU&apos;s AI Act enforcement framework enters its final legislative stage, 
              the debate has shifted from technical alignment to geopolitical competition.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-dispatch-ember/10 text-dispatch-ember border border-dispatch-ember/20 px-2.5 py-1 font-mono text-[11px] font-medium">
                AI Summary Available
              </span>
              <span className="inline-flex items-center gap-1.5 text-ink-900 font-medium text-sm hover:text-dispatch-ember transition-colors duration-150 link-underline cursor-pointer">
                View Nutrition Label →
              </span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-paper-200 max-w-[1400px] mx-auto" aria-hidden="true" />

      {/* ── Story Grid (CSS Subgrid) ────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Latest stories">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-mono text-[12px] uppercase tracking-widest text-ink-400">
            Latest Stories
          </h3>
          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-400">
            <button className="px-2 py-1 bg-ink-900 text-paper-50">Latest</button>
            <button className="px-2 py-1 border border-ink-100 hover:bg-paper-100 transition-colors">Impact</button>
            <button className="px-2 py-1 border border-ink-100 hover:bg-paper-100 transition-colors">Summarized</button>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10"
          role="feed"
          aria-label="News articles"
        >
          {/* Card 1 */}
          <article className="story-card grid grid-rows-subgrid row-span-3 gap-y-3 mb-12 border-b border-paper-200 pb-6">
            <h4 className="font-editorial text-xl font-[700] leading-tight text-ink-900 tracking-[-0.01em]">
              <span className="hover:text-dispatch-ember transition-colors duration-150 cursor-pointer">
                Global Markets Rally as G7 Inflation Cools for Third Straight Month
              </span>
            </h4>
            <p className="text-ink-600 text-sm leading-relaxed line-clamp-3">
              Benchmark indices across major economies posted gains after synchronized inflation data suggested central banks may have room to ease monetary policy in Q3.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
              <span className="text-dispatch-sage font-medium truncate">Bloomberg, Reuters</span>
              <span className="w-1 h-1 rounded-full bg-dispatch-slate shrink-0" aria-hidden="true" />
              <time dateTime="2026-06-10T13:30:00+08:00" className="shrink-0">1h ago</time>
              <span className="w-1 h-1 rounded-full bg-dispatch-slate shrink-0" aria-hidden="true" />
              <span className="text-dispatch-ember font-medium shrink-0 tracking-widest">AI Brief</span>
            </div>
          </article>

          {/* Card 2 */}
          <article className="story-card grid grid-rows-subgrid row-span-3 gap-y-3 mb-12 border-b border-paper-200 pb-6">
            <h4 className="font-editorial text-xl font-[700] leading-tight text-ink-900 tracking-[-0.01em]">
              <span className="hover:text-dispatch-ember transition-colors duration-150 cursor-pointer">
                Apple Unveils On-Device AI Framework With App Store Integration
              </span>
            </h4>
            <p className="text-ink-600 text-sm leading-relaxed line-clamp-3">
              The new framework allows third-party apps to tap into Apple Intelligence models running locally on iPhone and Mac, marking a shift toward edge computing.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
              <span className="text-dispatch-slate font-medium truncate">The Verge, 9to5Mac</span>
              <span className="w-1 h-1 rounded-full bg-dispatch-slate shrink-0" aria-hidden="true" />
              <time dateTime="2026-06-10T12:30:00+08:00" className="shrink-0">2h ago</time>
            </div>
          </article>

          {/* Card 3 */}
          <article className="story-card grid grid-rows-subgrid row-span-3 gap-y-3 mb-12 border-b border-paper-200 pb-6">
            <h4 className="font-editorial text-xl font-[700] leading-tight text-ink-900 tracking-[-0.01em]">
              <span className="hover:text-dispatch-ember transition-colors duration-150 cursor-pointer">
                GE2025: Campaign Enters Final Week With Housing Policy as Key Battleground
              </span>
            </h4>
            <p className="text-ink-600 text-sm leading-relaxed line-clamp-3">
              Candidates sharpen their positions on public housing supply and affordability as polling shows the issue has become decisive for undecided voters.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-600 mt-auto">
              <span className="text-dispatch-clay font-medium truncate">CNA, Straits Times</span>
              <span className="w-1 h-1 rounded-full bg-dispatch-slate shrink-0" aria-hidden="true" />
              <time dateTime="2026-06-10T11:30:00+08:00" className="shrink-0">3h ago</time>
              <span className="w-1 h-1 rounded-full bg-dispatch-slate shrink-0" aria-hidden="true" />
              <span className="text-dispatch-ember font-medium shrink-0 tracking-widest">AI Brief</span>
            </div>
          </article>
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="inline-flex items-center gap-2 border border-ink-100 bg-paper-50 text-ink-900 font-mono text-[11px] uppercase tracking-widest px-8 py-3 rounded-sm focus-visible:outline-none">
            Load More Stories
          </button>
        </div>
      </section>
    </main>
  );
}
