'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  Shield,
  Users,
  Zap,
  FileText,
  CheckCircle,
  ArrowRight,
  Layers,
  Target,
  Sparkles,
  BarChart3,
  GitBranch,
  Building2,
  Award,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1B365D] via-[#0070AD] to-[#12ABDB] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Proposal Generation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              ProposalAI
            </h1>
            <p className="text-xl md:text-2xl text-cyan-100 mb-4 max-w-3xl mx-auto">
              Intelligent Proposal Generation
            </p>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Transforming how your team wins business by leveraging our collective intelligence to create winning proposals in hours, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1B365D] px-8 py-4 rounded-lg font-semibold hover:bg-cyan-50 transition-colors"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                See How It Works
              </a>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* The Challenge */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              The Challenge
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our current proposal process creates bottlenecks and inconsistencies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Clock, label: 'TIME', text: 'Proposals take weeks to complete, missing opportunities' },
              { icon: BarChart3, label: 'QUALITY', text: 'Inconsistent output quality across teams and regions' },
              { icon: GitBranch, label: 'KNOWLEDGE', text: 'Best practices and case studies scattered across silos' },
              { icon: Users, label: 'RESOURCES', text: 'Senior experts bottlenecked on repetitive writing tasks' },
              { icon: FileText, label: 'REUSE', text: 'Winning strategies rarely captured or replicated' },
              { icon: TrendingUp, label: 'SCALE', text: 'Cannot pursue more opportunities with current capacity' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#0070AD]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="w-5 h-5 text-[#0070AD]" />
                  <span className="text-sm font-bold text-[#0070AD]">{item.label}</span>
                </div>
                <p className="text-gray-700">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#12ABDB] to-[#0070AD] rounded-2xl p-8 text-white text-center"
          >
            <p className="text-5xl font-bold mb-2">4-6 weeks</p>
            <p className="text-cyan-100">Average proposal cycle time</p>
          </motion.div>
        </div>
      </section>

      {/* Introducing ProposalAI */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-6">
                Introducing ProposalAI
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                ProposalAI is an intelligent platform that leverages your team's collective knowledge to generate winning proposals in hours, not weeks.
              </p>
              <p className="text-gray-600 mb-8">
                It combines our methodologies, case studies, and institutional expertise with advanced AI to create consistent, high-quality proposals at scale.
              </p>
              <div className="bg-[#0070AD] rounded-xl p-6 text-white">
                <p className="text-3xl font-bold mb-1">Hours, Not Weeks</p>
                <p className="text-cyan-100">From initial brief to complete proposal</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                { icon: Building2, title: 'Embedded Expertise', desc: 'Built-in industry methodologies, frameworks, and best practices' },
                { icon: Shield, title: 'Verified Content', desc: 'Real case studies with verified metrics and outcomes' },
                { icon: Target, title: 'Intent-Driven', desc: 'Every proposal aligned to client outcomes and win strategy' },
                { icon: Users, title: 'Human Quality', desc: 'AI generates, humans review and refine' },
              ].map((item, i) => (
                <div key={item.title} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#0070AD]/10 rounded-lg">
                      <item.icon className="w-5 h-5 text-[#0070AD]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1B365D] mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* IDD Methodology */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              Intent-Driven Development (IDD)
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A 3-layer context model for trustworthy AI generation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { layer: 'L1', title: 'Company Truth', desc: 'Verified capabilities, certifications, case studies, and methodologies. The canonical source of what we can claim.', color: 'from-[#1B365D] to-[#2A4A72]' },
              { layer: 'L2', title: 'Proposal Intent', desc: 'Client outcomes, win strategy, constraints, and success metrics. Human-defined goals that guide generation.', color: 'from-[#0070AD] to-[#0088CC]' },
              { layer: 'L3', title: 'Generated Content', desc: 'AI-created proposal sections, reviewed and refined by humans. Every claim traceable to L1 sources.', color: 'from-[#12ABDB] to-[#40C4FF]' },
            ].map((item, i) => (
              <motion.div
                key={item.layer}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white`}
              >
                <div className="text-sm font-medium text-white/70 mb-2">{item.layer}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#12ABDB]"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-[#12ABDB]" />
              <span className="text-sm font-bold text-[#0070AD]">KEY DIFFERENTIATOR</span>
            </div>
            <p className="text-lg font-semibold text-[#1B365D]">
              Every claim in every proposal is traceable to verified company sources
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              Why We're Different
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Embedded Methodologies', desc: 'Built-in CCMF, ADMnext, and eAPM frameworks ensure consistent, proven approaches' },
              { title: 'Verified Case Studies', desc: 'Real examples with metrics: BMW 5,200+ apps, HMRC £245M contract, aerospace migrations' },
              { title: 'Intent-First Approach', desc: 'Start with client outcomes and win strategy - every section aligned to what matters most' },
              { title: 'Human-in-the-Loop', desc: 'AI accelerates, humans validate. Quality control at every stage of the process' },
              { title: 'Full Lifecycle', desc: 'Not just generation - review, collaboration, versioning, and multi-format export' },
              { title: 'Traceable Claims', desc: 'Every claim links back to verified sources. No hallucinations, no unsupported statements' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border-t-4 border-[#0070AD] shadow-sm"
              >
                <h3 className="font-semibold text-[#1B365D] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-600 italic">
            This isn't generic AI - it's your team's institutional knowledge, made accessible
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              How It Works
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-16">
            {[
              { num: '1', title: 'Define', desc: 'Enter client details, industry, and opportunity type' },
              { num: '2', title: 'Outcomes', desc: 'Set desired outcomes, win strategy, and constraints' },
              { num: '3', title: 'Generate', desc: 'AI creates sections using company context' },
              { num: '4', title: 'Review', desc: 'Refine content, collaborate with team' },
              { num: '5', title: 'Export', desc: 'Download in your preferred format' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 text-center"
              >
                <div className="w-16 h-16 bg-[#0070AD] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="font-semibold text-[#1B365D] mb-1">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
                {i < 4 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-5 h-5 text-[#12ABDB]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-[#0070AD] mb-2">EXPORT FORMATS</p>
              <p className="text-gray-700">PPTX, DOCX, PDF, Web</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-[#0070AD] mb-2">SECTIONS GENERATED</p>
              <p className="text-gray-700 text-sm">Executive Summary, Approach, Methodology, Team, Case Studies, Timeline, Pricing, Risk, Why Us</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              Key Benefits
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { metric: '90%', label: 'Faster Delivery', desc: 'From weeks to hours', highlight: true },
              { metric: '15-25%', label: 'Win Rate Potential', desc: 'Better targeting & quality', highlight: false },
              { metric: '100%', label: 'Consistent Quality', desc: 'Best practices always', highlight: false },
              { metric: '3x', label: 'More Opportunities', desc: 'Same team capacity', highlight: false },
              { metric: '1', label: 'Knowledge Source', desc: 'Unified expertise', highlight: false },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-6 text-center border-t-4 ${
                  item.highlight
                    ? 'bg-cyan-50 border-[#12ABDB]'
                    : 'bg-white border-[#0070AD]'
                }`}
              >
                <p className={`text-4xl font-bold mb-2 ${
                  item.highlight ? 'text-[#12ABDB]' : 'text-[#0070AD]'
                }`}>
                  {item.metric}
                </p>
                <p className="font-semibold text-[#1B365D] mb-1">{item.label}</p>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              Platform Features
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-[#0070AD] mb-6">Core Capabilities</h3>
              <ul className="space-y-3">
                {[
                  'Step-by-step proposal creation wizard',
                  'AI-generated sections with source citations',
                  'Outcome contract definition with success metrics',
                  'Win strategy analysis and positioning',
                  'Version history and change tracking',
                  'Team collaboration and comments',
                  'Multi-format export (PPTX, DOCX, PDF)',
                  'Knowledge base with RAG search',
                ].map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <CheckCircle className="w-5 h-5 text-[#12ABDB] flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1B365D] to-[#2A4A72] rounded-2xl p-8 text-white"
            >
              <h3 className="text-xl font-semibold mb-6">Modern User Experience</h3>
              <div className="space-y-4">
                {[
                  { title: 'Warm, Human Design', desc: 'Clean, approachable interface that guides users through the process' },
                  { title: 'Real-Time Generation', desc: 'Watch AI create content with live progress updates' },
                  { title: 'Inline Editing', desc: 'Edit, refine, and perfect content directly in the interface' },
                  { title: 'Source Transparency', desc: 'See exactly which company sources informed each section' },
                ].map((item, i) => (
                  <div key={item.title} className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-[#12ABDB] mb-1">{item.title}</h4>
                    <p className="text-white/80 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B365D] mb-4">
              Future Roadmap
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { phase: 'Phase 1', title: 'Foundation', items: ['Core generation', 'IDD methodology', 'Knowledge base', 'Multi-format export'], current: true },
              { phase: 'Phase 2', title: 'RFP Intelligence', items: ['RFP parsing', 'Auto-response mapping', 'Requirement extraction', 'Compliance checking'], current: false },
              { phase: 'Phase 3', title: 'Competitive Intel', items: ['Competitor analysis', 'Differentiation', 'Market positioning', 'Win themes'], current: false },
              { phase: 'Phase 4', title: 'Learning Loop', items: ['Win/loss analysis', 'Feedback integration', 'Continuous improvement', 'Pattern mining'], current: false },
              { phase: 'Phase 5', title: 'Voice & CRM', items: ['Client voice', 'Salesforce integration', 'Pipeline automation', 'Opportunity scoring'], current: false },
            ].map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <div className={`p-4 ${phase.current ? 'bg-[#12ABDB]' : 'bg-[#0070AD]'} text-white`}>
                  <p className="text-xs opacity-80">{phase.phase}</p>
                  <p className="font-semibold">
                    {phase.title}
                    {phase.current && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">NOW</span>}
                  </p>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {phase.items.map((item, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0070AD]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-[#1B365D] via-[#0070AD] to-[#12ABDB] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Rocket className="w-12 h-12 mx-auto mb-6 text-cyan-200" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Proposal Process?
            </h2>
            <p className="text-xl text-cyan-100 mb-10">
              Join the pilot program and experience the future of proposal generation
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { num: '1', title: 'Pilot Program', desc: 'Select teams to test with real opportunities' },
                { num: '2', title: 'Training', desc: 'Onboard users and configure knowledge base' },
                { num: '3', title: 'Rollout', desc: 'Scale to broader organization' },
              ].map((step) => (
                <div key={step.num} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-t-2 border-[#12ABDB]">
                  <p className="text-2xl font-bold text-[#12ABDB] mb-2">{step.num}</p>
                  <p className="font-semibold mb-1">{step.title}</p>
                  <p className="text-white/70 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1B365D] px-10 py-4 rounded-lg font-semibold hover:bg-cyan-50 transition-colors text-lg"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-8 text-white/60 text-sm">
              ProposalAI | Intelligent Proposal Generation | 2026
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
