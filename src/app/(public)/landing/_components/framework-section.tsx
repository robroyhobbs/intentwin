"use client";

import { useState } from "react";
import Image from "next/image";

interface Layer {
  name: string;
  desc: string;
}

interface FrameworkSectionProps {
  layers: Layer[];
  activeLayer: number | null;
  setActiveLayer: (layer: number | null) => void;
}

export function FrameworkSection({
  layers,
  activeLayer,
  setActiveLayer,
}: FrameworkSectionProps) {
  const currentLayer = activeLayer ?? 0;

  return (
    <section id="framework" className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="text-purple-400 font-mono text-sm tracking-wider uppercase bg-purple-900/20 px-4 py-2 rounded-full border border-purple-800/30">
            The Intent Framework
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mt-8 mb-6 tracking-tight leading-tight">
            Six layers between your draft <br className="hidden md:block"/>
            <span className="text-zinc-500">and a winning proposal.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl text-lg font-light">
            Not a generic AI writer. A structured methodology trained on how deals are actually won.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Layer List */}
          <div className="lg:col-span-5 flex flex-col gap-2 relative">
            {/* Connecting line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-zinc-800"></div>
            
            {layers.map((layer, i) => (
              <div
                key={i}
                className={`relative pl-16 pr-6 py-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  currentLayer === i 
                    ? "bg-zinc-900/80 border border-zinc-800 shadow-xl" 
                    : "hover:bg-zinc-900/40 border border-transparent"
                }`}
                onMouseEnter={() => setActiveLayer(i)}
                onClick={() => setActiveLayer(i)}
              >
                {/* Node indicator */}
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 z-10 transition-colors duration-300 ${
                  currentLayer === i 
                    ? "bg-purple-500 border-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.8)]" 
                    : "bg-zinc-800 border-zinc-950"
                }`}></div>
                
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-mono font-bold tracking-widest ${
                    currentLayer === i ? "text-purple-400" : "text-zinc-600"
                  }`}>
                    LAYER {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={`text-xl font-bold transition-colors ${
                    currentLayer === i ? "text-white" : "text-zinc-400"
                  }`}>
                    {layer.name}
                  </h3>
                  <p className={`text-sm mt-2 transition-all duration-300 overflow-hidden ${
                    currentLayer === i ? "max-h-24 opacity-100 text-zinc-300" : "max-h-0 opacity-0"
                  }`}>
                    {layer.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visualization UI Area */}
          <div className="lg:col-span-7 relative">
            <div className="aspect-[4/3] rounded-3xl bg-[#0d1117] border border-zinc-800 shadow-2xl overflow-hidden relative group">
              
              {/* Decorative glows based on active layer */}
              <div className="absolute inset-0 transition-opacity duration-1000 opacity-20">
                <div className={`absolute top-0 right-0 w-96 h-96 bg-purple-500/30 blur-[100px] rounded-full mix-blend-screen transition-transform duration-1000 ${currentLayer % 2 === 0 ? 'translate-x-10 translate-y-10' : '-translate-x-10 -translate-y-10'}`}></div>
                <div className={`absolute bottom-0 left-0 w-96 h-96 bg-blue-500/30 blur-[100px] rounded-full mix-blend-screen transition-transform duration-1000 ${currentLayer % 2 === 1 ? 'translate-x-10 -translate-y-10' : '-translate-x-10 translate-y-10'}`}></div>
              </div>

              {/* Mockup Header */}
              <div className="absolute top-0 inset-x-0 h-12 bg-zinc-900/80 backdrop-blur border-b border-zinc-800/50 flex items-center px-4 z-20">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-zinc-500">
                  intentbid-engine
                </div>
              </div>

              {/* Dynamic Content based on Layer */}
              <div className="absolute inset-0 pt-12 p-8 flex flex-col z-10">
                <div className="text-zinc-500 text-xs font-mono mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Processing {layers[currentLayer].name.toLowerCase()}...
                </div>
                
                {/* Code-like transition effect */}
                <div className="space-y-4 font-mono text-sm">
                  {currentLayer === 0 && (
                     <>
                       <div className="text-zinc-400">{'<Context>'}</div>
                       <div className="pl-4 text-green-400">Loading brand guidelines... OK</div>
                       <div className="pl-4 text-green-400">Scanning past proposals... 1,240 tokens analyzed</div>
                       <div className="pl-4 text-purple-300 border-l-2 border-purple-500 pl-4 py-2 bg-purple-500/10 mt-2">
                         Applying specific corporate vocabulary...
                         <br/>
                         Replaced &quot;vendors&quot; with &quot;strategic partners&quot;
                         <br/>
                         Replaced &quot;cheap&quot; with &quot;cost-optimized&quot;
                       </div>
                       <div className="text-zinc-400">{'</Context>'}</div>
                     </>
                  )}
                  {currentLayer === 1 && (
                     <>
                       <div className="text-zinc-400">{'<Structure>'}</div>
                       <div className="pl-4 text-zinc-300">Validating section: &quot;Executive Summary&quot;</div>
                       <div className="pl-4 mt-2">
                         <span className="text-red-400 mr-2">- Missing explicit client pain point in paragraph 1</span>
                         <br/>
                         <span className="text-green-400 mr-2">+ Re-ordering to match evaluator rubric (Requirements section 3.2)</span>
                         <br/>
                         <span className="text-green-400 mr-2">+ Injecting &quot;Why Us&quot; bridge paragraph</span>
                       </div>
                       <div className="text-zinc-400 mt-2">{'</Structure>'}</div>
                     </>
                  )}
                  {currentLayer > 1 && (
                     <>
                       <div className="text-zinc-400 animate-pulse">Analyzing text block...</div>
                       <div className="mt-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
                         <div className="text-zinc-300 blur-sm select-none">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/50 px-3 py-1 rounded text-xs backdrop-blur-md">
                              Applying {layers[currentLayer].name} layer
                            </span>
                         </div>
                       </div>
                       <div className="mt-4 text-zinc-500">
                         {layers[currentLayer].desc}
                       </div>
                     </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
