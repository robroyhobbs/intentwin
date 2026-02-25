"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <>
      {/* Navigation */}
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-md shadow-[0_0_10px_rgba(192,132,252,0.4)]">

  <rect width="512" height="512" rx="100" fill="#09090B"/>
  <rect x="176" y="144" width="32" height="224" rx="16" fill="url(#monogram_grad_1)"/>
  <path d="M232 144H320C355.346 144 384 172.654 384 208C384 233.167 369.458 254.918 348.65 265.558C374.881 275.64 394 300.911 394 330C394 369.764 361.764 402 322 402H232V144Z" stroke="url(#monogram_grad_2)" strokeWidth="28" strokeLinejoin="round" strokeLinecap="round"/>
  <path d="M232 268H320" stroke="url(#monogram_grad_2)" strokeWidth="28" strokeLinecap="round"/>
  <circle cx="192" cy="112" r="16" fill="url(#monogram_grad_1)"/>
  <circle cx="232" cy="112" r="16" fill="url(#monogram_grad_2)"/>
  <defs>
    <linearGradient id="monogram_grad_1" x1="176" y1="112" x2="208" y2="368" gradientUnits="userSpaceOnUse">
      <stop stopColor="#818CF8"/>
      <stop offset="1" stopColor="#C084FC"/>
    </linearGradient>
    <linearGradient id="monogram_grad_2" x1="232" y1="144" x2="394" y2="402" gradientUnits="userSpaceOnUse">
      <stop stopColor="#C084FC"/>
      <stop offset="1" stopColor="#F472B6"/>
    </linearGradient>
  </defs>

            </svg>
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/product">Product</Link>
            <Link href="/intelligence-overview">Intelligence</Link>
            <a href="#compare">Compare</a>
            <a href="#framework">Framework</a>
            <a href="#gov">Gov</a>
            <a href="#pricing">Pricing</a>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/login" className="vf-nav-signin">
              Sign In
            </Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="vf-hero pt-32 pb-16 relative">
        <div className="vf-hero-glow" aria-hidden="true" />
        
        <div className="vf-hero-inner max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <span className="vf-badge mb-8">Invite Only Early Access</span>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            The AI proposal engineer <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">built to win.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 font-light leading-relaxed">
            Structured persuasion intelligence for every RFP, SOW, and capability statement. Market data to find the right deals. AI scoring to qualify them. A proven methodology to win them.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/request-access" className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all text-lg shadow-[0_0_30px_rgba(167,139,250,0.3)] hover:shadow-[0_0_40px_rgba(167,139,250,0.5)]">
              Request Access
            </Link>
            <a href="#compare" className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-full hover:bg-zinc-800 transition-all text-lg">
              Explore the framework
            </a>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-500 mb-20">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z" fill="#a78bfa"/></svg>
              Human-in-the-loop
            </span>
            <span className="hidden sm:block text-zinc-800">|</span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#a78bfa" strokeWidth="1.5"/><path d="M5 8L7 10L11 6" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Market intelligence built in
            </span>
            <span className="hidden sm:block text-zinc-800">|</span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/></svg>
              AI bid scoring &amp; qualification
            </span>
          </div>
          
          {/* Editor/App Mockup - Copilot Style */}
          <div className="w-full relative mx-auto mt-8 max-w-5xl perspective-[2000px]">
            {/* Background Glows for Editor */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="relative rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-2xl overflow-hidden transform-gpu hover:scale-[1.01] transition-transform duration-500 ease-out">
              {/* Window Header */}
              <div className="flex items-center px-4 py-3 bg-[#161b22] border-b border-zinc-800">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-zinc-500 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  proposal-executive-summary.md — IntentBid Editor
                </div>
              </div>
              
              {/* Editor Body */}
              <div className="flex flex-col md:flex-row text-left font-mono text-sm leading-relaxed text-zinc-300">
                {/* Sidebar (File tree) */}
                <div className="hidden md:block w-64 bg-[#0d1117] border-r border-zinc-800 p-4 shrink-0">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Project Files</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-300 bg-zinc-800/50 px-2 py-1.5 rounded cursor-pointer">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Executive Summary
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-400 px-2 py-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Technical Approach
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-400 px-2 py-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Past Performance
                    </div>
                  </div>
                  
                  <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Intent Layers</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Brand Voice</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Persuasion Framework</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Win Themes</span>
                      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 p-6 overflow-hidden bg-[#0d1117] relative">
                  <div className="flex">
                    <div className="text-zinc-600 select-none pr-4 text-right border-r border-zinc-800 mr-4 font-mono">
                      1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9
                    </div>
                    <div className="flex-1 font-mono">
                      <div className="text-blue-400"># Executive Summary</div>
                      <div className="mt-4"><span className="text-purple-400">Our approach</span> solves the core challenge outlined in your RFP by combining...</div>
                      <div className="mt-4 text-zinc-600 italic">
                        {"// IntentBid AI:"} Applying PAS (Problem-Agitation-Solution) framework...
                      </div>
                      <div className="mt-2 border-l-2 border-purple-500 pl-4 py-1 bg-purple-500/10 rounded-r text-zinc-200">
                        <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 uppercase tracking-wide font-sans font-bold">Suggestion</span>
                        Instead of leading with &quot;Our approach&quot;, agitate the problem first to build urgency.
                        <br/>
                        <div className="mt-3 text-green-300">
                          <span className="text-green-500 mr-2">+</span>
                          <span className="opacity-90">Every day your legacy system remains in place, you risk critical compliance failures. We eliminate that risk on day one.</span>
                          <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1 align-middle"></span>
                        </div>
                        <div className="flex gap-2 mt-4 font-sans text-xs">
                          <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
                            Accept
                          </button>
                          <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors">
                            Regenerate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-white mb-6">
            The difference between winning and losing a contract is not what you
            can do — <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">it&apos;s how you present it.</span>
          </p>
          <p className="text-zinc-400 text-xl font-light">
            Find the right opportunities, qualify them with data, and generate proposals that score like they were written by your best capture team.
          </p>
        </div>
      </section>
    </>
  );
}
