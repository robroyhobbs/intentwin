"use client";

export function BenefitsSection() {
  return (
    <section id="why-intentbid" className="py-32 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute right-0 bottom-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-24 text-center">
          <span className="text-indigo-400 font-mono text-sm tracking-wider uppercase bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-800/30">
            Why IntentBid
          </span>
        </div>

        <div className="space-y-32">
          {/* Benefit 1 */}
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                Hours,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">not weeks.</span>
              </h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed">
                Drop in any source document — PDF, DOCX, PPTX, TXT, MD, or CSV.
                Get a polished, submission-ready draft before the end of the day.
                Not a rough outline. A complete proposal.
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden relative group">
                {/* Simulated file drop UI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0a0a0c] border-2 border-dashed border-zinc-800 rounded-xl m-4 group-hover:border-indigo-500/50 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <div className="text-zinc-300 font-medium mb-2">Drop your RFP documents here</div>
                  <div className="text-zinc-600 text-sm">PDF, DOCX, CSV up to 50MB</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                Every section
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">engineered.</span>
              </h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed">
                Persuasion intelligence applied to every paragraph, every
                heading, every proof point. Brand voice, win themes, competitive
                positioning, and evidence &mdash; structured into every draft.
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="aspect-video rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-2xl overflow-hidden relative">
                {/* Simulated engineering visualization */}
                <div className="absolute inset-0 p-6 flex items-center justify-center">
                  <div className="w-full max-w-sm space-y-4">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[100%]"></div>
                    </div>
                    <div className="h-2 w-[80%] bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[100%] opacity-80"></div>
                    </div>
                    <div className="h-2 w-[90%] bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[100%] opacity-60"></div>
                    </div>
                    <div className="h-2 w-[60%] bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[100%] opacity-40"></div>
                    </div>
                    <div className="mt-8 flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
                      <span>Analyzing</span>
                      <span className="text-purple-400">100% Optimized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                Gets smarter
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">every time.</span>
              </h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed">
                Continuous learning from your outcomes. Win rates improve because
                the system remembers what works — building a knowledge base unique
                to your organization.
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="aspect-video rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-2xl overflow-hidden relative">
                {/* Simulated chart/graph UI */}
                <div className="absolute inset-0 flex items-end justify-between p-8 gap-2">
                  <div className="w-1/6 bg-zinc-800 rounded-t-sm h-[20%]"></div>
                  <div className="w-1/6 bg-zinc-800 rounded-t-sm h-[35%]"></div>
                  <div className="w-1/6 bg-zinc-700 rounded-t-sm h-[40%]"></div>
                  <div className="w-1/6 bg-blue-900/50 rounded-t-sm h-[60%]"></div>
                  <div className="w-1/6 bg-blue-500/80 rounded-t-sm h-[75%] shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                  <div className="w-1/6 bg-emerald-400 rounded-t-sm h-[90%] shadow-[0_0_20px_rgba(52,211,153,0.5)]"></div>
                </div>
                <div className="absolute top-8 left-8">
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    Win Rate <span className="text-emerald-400 text-sm flex items-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg> 42%</span>
                  </div>
                  <div className="text-zinc-500 text-sm font-mono mt-1">Q4 Performance vs Baseline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
