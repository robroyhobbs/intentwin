"use client";

interface CompareRow {
  label: string;
  old: string;
  new: string;
}

interface CompareSectionProps {
  oldWay: CompareRow[];
}

export function CompareSection({ oldWay }: CompareSectionProps) {
  return (
    <section id="compare" className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-purple-400 font-mono text-sm tracking-wider uppercase bg-purple-900/20 px-4 py-2 rounded-full border border-purple-800/30">
            The Old Way vs IntentBid
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-8 mb-6">
            Stop leaving wins on the table.
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Traditional proposal writing is slow, unscalable, and inconsistent. IntentBid transforms your process into a high-velocity persuasion engine.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {oldWay.map((row, i) => (
            <div 
              key={i} 
              className={`group relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-800/50 transition-colors ${i === 0 || i === 3 ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1"}`}
            >
              {/* Subtle gradient hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-purple-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </span>
                  {row.label}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 p-4 bg-zinc-950/50 border border-zinc-900 rounded-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Before</span>
                    <span className="text-zinc-400 text-sm">{row.old}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 bg-purple-900/10 border border-purple-900/30 rounded-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full translate-x-16 -translate-y-16"></div>
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">With IntentBid</span>
                    <span className="text-white font-medium text-lg leading-snug">{row.new}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
