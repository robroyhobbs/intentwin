import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* ------------------------------------------------------------------ */
/*  Blog content — static articles                                     */
/* ------------------------------------------------------------------ */

interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  tag: string;
  metaDescription: string;
  content: React.ReactNode;
}

const POSTS: Record<string, BlogPost> = {
  "why-we-built-intentbid": {
    title: "Why We Built IntentBid",
    date: "February 20, 2026",
    readTime: "5 min read",
    tag: "Company",
    metaDescription:
      "The proposal process is broken. We built IntentBid to give every company the proposal capability that used to require a dedicated capture team.",
    content: (
      <>
        <p>
          We&rsquo;ve both been on the wrong end of a lost contract. Not because
          we lacked capability &mdash; but because our proposal didn&rsquo;t
          communicate it. The technical approach was solid. The past performance
          was relevant. The price was competitive. But the proposal read like it
          was assembled by committee, because it was.
        </p>
        <p>
          That experience &mdash; watching great teams lose contracts to
          competitors who simply <em>presented</em> better &mdash; is why we
          built IntentBid.
        </p>

        <h2>The real problem isn&rsquo;t writing speed</h2>
        <p>
          Most AI proposal tools focus on speed: &ldquo;Generate a proposal in
          minutes.&rdquo; Speed is nice. But speed without strategy just means
          you produce mediocre proposals faster.
        </p>
        <p>
          The real problem is that proposal quality is inconsistent, institutional
          knowledge is trapped in people&rsquo;s heads, and persuasion
          frameworks are applied by feel rather than by system. When your best
          capture manager is writing, proposals win. When anyone else does,
          they&rsquo;re a coin flip.
        </p>

        <h2>What we wanted to exist</h2>
        <p>
          We wanted a tool that does what the best capture teams do &mdash; but
          systematically:
        </p>
        <ul>
          <li>Start with strategy, not a blank page</li>
          <li>Apply proven persuasion frameworks to every section</li>
          <li>
            Weave win themes and competitive positioning throughout, not just in
            the executive summary
          </li>
          <li>
            Back every claim with actual evidence from your past performance
          </li>
          <li>
            Learn from outcomes &mdash; what worked, what didn&rsquo;t, and why
          </li>
        </ul>
        <p>
          That&rsquo;s what IntentBid is. Not a text generator. A proposal
          engineering system with a 6-layer methodology we call the Intent
          Framework.
        </p>

        <h2>Built for the companies that need it most</h2>
        <p>
          Enterprise firms with 50-person capture teams already have process.
          They have Shipley. They have color team reviews. They have dedicated
          writers.
        </p>
        <p>
          But the 10-to-200-person firm? They&rsquo;re competing for the same
          contracts with a fraction of the resources. Their subject matter
          experts are also their proposal writers. Their competitive
          intelligence lives in a shared drive somewhere. Their win themes
          change from proposal to proposal because there&rsquo;s no system to
          enforce consistency.
        </p>
        <p>
          IntentBid gives these firms the proposal capability of a company ten
          times their size. That&rsquo;s the mission.
        </p>

        <h2>Where we are today</h2>
        <p>
          IntentBid is live in invite-only early access. We&rsquo;re working
          closely with initial customers to refine the Intent Framework and
          build the features that matter most. If you&rsquo;re tired of watching
          proposals go out the door and knowing they could be better &mdash;
          we&rsquo;d love to talk.
        </p>
      </>
    ),
  },

  "smb-government-contracts": {
    title:
      "How Small and Mid-Market Firms Can Compete for Government Contracts",
    date: "February 18, 2026",
    readTime: "6 min read",
    tag: "Strategy",
    metaDescription:
      "You don't need a 50-person capture team to win federal contracts. Here's how AI-powered proposal intelligence levels the playing field.",
    content: (
      <>
        <p>
          The federal government spends over $700 billion annually on contracts.
          A significant portion is set aside for small businesses &mdash; 8(a),
          HUBZone, WOSB, SDVOSB programs exist specifically to level the playing
          field. But set-asides don&rsquo;t write your proposal for you.
        </p>
        <p>
          Small and mid-market firms face a structural disadvantage in proposal
          quality. Not because they lack capability, but because they lack
          process. The result: technically qualified firms submit proposals that
          read like afterthoughts, while larger competitors with dedicated
          capture teams submit polished, persuasive responses that score higher
          on every evaluation criteria.
        </p>

        <h2>The capture team gap</h2>
        <p>
          A typical large defense contractor has dedicated roles for every phase
          of proposal development: capture managers, proposal coordinators,
          volume leads, technical writers, pricing analysts, and review teams.
          They follow formalized methodologies like Shipley, running Pink Team,
          Red Team, and Gold Team reviews before anything ships.
        </p>
        <p>
          A 30-person IT services firm? Their proposal process looks more like
          this: the CEO finds an opportunity on SAM.gov, forwards it to two
          engineers who have client work due the same week, and someone pulls an
          old proposal from a shared folder to use as a &ldquo;template.&rdquo;
        </p>
        <p>
          The capability gap isn&rsquo;t in what these firms can deliver. It&rsquo;s
          in how they present it.
        </p>

        <h2>What technology can actually solve</h2>
        <p>
          AI can&rsquo;t give you past performance you don&rsquo;t have. It
          can&rsquo;t fabricate certifications or security clearances. But it
          can solve the presentation problem:
        </p>
        <ul>
          <li>
            <strong>Structured methodology</strong> &mdash; Apply proven
            persuasion frameworks (AIDA, PAS, STAR) to every section
            automatically, so your executive summary reads like it was written
            by a capture professional
          </li>
          <li>
            <strong>Institutional memory</strong> &mdash; Build a knowledge base
            of your capabilities, past performance, and differentiators that
            every proposal draws from consistently
          </li>
          <li>
            <strong>Compliance mapping</strong> &mdash; Automatically extract
            requirements from Section L/M and ensure every evaluation criterion
            is addressed
          </li>
          <li>
            <strong>Speed to respond</strong> &mdash; When you can respond to
            10x more RFPs with the same team, your pipeline math changes
            entirely
          </li>
        </ul>

        <h2>The math that matters</h2>
        <p>
          Consider a firm that currently submits 4 proposals per month with a 15%
          win rate at $150K average contract value. That&rsquo;s roughly $90K in
          monthly wins.
        </p>
        <p>
          If AI-powered proposal intelligence lets them respond to 10x more
          opportunities while improving win rates to 25-30% through better
          presentation quality, the same team is now generating $450K-$540K in
          monthly pipeline. That&rsquo;s not a marginal improvement. That&rsquo;s
          a different business.
        </p>

        <h2>Getting started</h2>
        <p>
          The firms that win consistently do three things well: they pick the
          right opportunities, they present their capability persuasively, and
          they learn from every outcome. Technology like IntentBid can&rsquo;t
          replace your expertise. But it can make sure that expertise shows up
          in every proposal you submit.
        </p>
      </>
    ),
  },

  "problem-with-proposal-templates": {
    title: "The Problem with Proposal Templates",
    date: "February 14, 2026",
    readTime: "4 min read",
    tag: "Insights",
    metaDescription:
      "Templates promise efficiency but deliver mediocrity. Why the most popular approach to proposal writing is costing you wins.",
    content: (
      <>
        <p>
          Every proposal team has a templates folder. Past proposals stripped
          of client-specific details, saved as starting points for the next
          one. It feels efficient. It&rsquo;s actually one of the biggest
          reasons proposals fail to differentiate.
        </p>

        <h2>The template trap</h2>
        <p>
          Templates create three problems that compound over time:
        </p>
        <p>
          <strong>1. They anchor to the wrong starting point.</strong> When you
          start from a previous proposal, you inherit its structure, its
          framing, and its assumptions. The new client has different pain
          points, different evaluation criteria, and different competitive
          context. But the template pulls you toward reusing what already
          exists instead of thinking about what this specific evaluator needs
          to hear.
        </p>
        <p>
          <strong>2. They dilute persuasion over time.</strong> Each time a
          template is reused, the original persuasive intent degrades. Win
          themes written for Client A get softened into generic claims by the
          time they reach Client D. Specific evidence gets replaced with
          vague assertions. The proposal gets safer and less compelling with
          each iteration.
        </p>
        <p>
          <strong>3. They create a false sense of completeness.</strong> A
          filled-in template looks like a finished proposal. Every section has
          content. But &ldquo;has content&rdquo; and &ldquo;makes a compelling
          case&rdquo; are very different things. Teams check the box on
          compliance without checking whether they&rsquo;ve actually made the
          case for why they should win.
        </p>

        <h2>What works instead</h2>
        <p>
          The alternative isn&rsquo;t starting from a blank page every time.
          That&rsquo;s even worse. The alternative is starting from
          <em> intent</em>.
        </p>
        <p>
          Before any text is generated, define: What does this evaluator need
          to believe? What are our three strongest differentiators for this
          specific opportunity? What evidence do we have that proves each
          claim?
        </p>
        <p>
          When you start from intent rather than a template, every section
          serves a purpose. Win themes aren&rsquo;t inherited from old
          proposals &mdash; they&rsquo;re derived from the competitive context
          of this bid. Evidence isn&rsquo;t generic &mdash; it&rsquo;s selected
          for relevance to this evaluator&rsquo;s criteria.
        </p>

        <h2>Templates as a symptom</h2>
        <p>
          Teams rely on templates because the alternative &mdash; building
          structured, persuasive proposals from scratch &mdash; takes too long.
          That&rsquo;s a real constraint. But the answer isn&rsquo;t to accept
          mediocre starting points. The answer is to make good starting points
          fast.
        </p>
        <p>
          That&rsquo;s the gap AI proposal intelligence fills. Not by
          generating generic text faster, but by generating
          <em> strategic</em> text &mdash; text that starts from win themes,
          applies persuasion frameworks, and backs claims with evidence.
          Tailored to this client, this opportunity, this competitive context.
          Every time.
        </p>
      </>
    ),
  },

  "intent-driven-proposals": {
    title: "Intent-Driven Proposals: Strategy Before Writing",
    date: "February 10, 2026",
    readTime: "5 min read",
    tag: "Product",
    metaDescription:
      "Most proposal tools start with a blank page. IntentBid starts with intent — a structured definition of what needs to be true for the evaluator to say yes.",
    content: (
      <>
        <p>
          Open most proposal tools and you get a blank editor. Maybe some
          section headings. Maybe a content library to pull boilerplate from.
          The implicit assumption: you know what to write, you just need a
          faster way to write it.
        </p>
        <p>
          That assumption is wrong. The hard part of proposals isn&rsquo;t
          typing. It&rsquo;s figuring out what to say, in what order, with what
          evidence, framed against which competitors, tailored to which
          evaluation criteria. That&rsquo;s strategy. And most tools skip it
          entirely.
        </p>

        <h2>What is intent?</h2>
        <p>
          In IntentBid, &ldquo;intent&rdquo; is a structured definition of what
          needs to be true for the evaluator to choose you. It&rsquo;s defined
          before any content is generated, and it governs everything that
          follows.
        </p>
        <p>Intent includes:</p>
        <ul>
          <li>
            <strong>Client context</strong> &mdash; Who is the evaluator? What
            are their pain points? What do they care about most?
          </li>
          <li>
            <strong>Win themes</strong> &mdash; The 3-5 reasons you should win
            this specific opportunity, not generic strengths
          </li>
          <li>
            <strong>Competitive positioning</strong> &mdash; How to frame your
            approach so it implicitly addresses competitor weaknesses
          </li>
          <li>
            <strong>Evidence mapping</strong> &mdash; Which past performance,
            case studies, and capabilities support each win theme
          </li>
          <li>
            <strong>Outcome contract</strong> &mdash; The specific transformation
            you&rsquo;re promising, stated in terms the client measures
          </li>
        </ul>

        <h2>The 6-layer Intent Framework</h2>
        <p>
          Once intent is defined, IntentBid applies six layers of intelligence
          to every section of the proposal:
        </p>
        <ol>
          <li>
            <strong>Brand Voice</strong> &mdash; Your specific tone,
            terminology, and communication style
          </li>
          <li>
            <strong>Section Best Practices</strong> &mdash; Proven structure for
            each section type based on what evaluators expect
          </li>
          <li>
            <strong>Persuasion Frameworks</strong> &mdash; AIDA, PAS, FAB, STAR
            &mdash; calibrated per section based on its purpose
          </li>
          <li>
            <strong>Win Themes</strong> &mdash; Your differentiators woven
            naturally throughout, not just stated once in the exec summary
          </li>
          <li>
            <strong>Competitive Positioning</strong> &mdash; Indirect framing
            that elevates your approach without naming competitors
          </li>
          <li>
            <strong>Evidence &amp; Context</strong> &mdash; Every claim backed
            by specific capabilities, case studies, or past performance
          </li>
        </ol>

        <h2>Why this order matters</h2>
        <p>
          Most AI writing tools apply one layer: generate text from a prompt.
          The result reads like AI wrote it &mdash; because the text has no
          strategic foundation.
        </p>
        <p>
          Intent-driven proposals read like a senior capture manager wrote
          them &mdash; because they&rsquo;re built on the same strategic
          thinking a senior capture manager would apply. The AI handles the
          assembly. The methodology ensures quality.
        </p>

        <h2>Strategy is the moat</h2>
        <p>
          Any tool can generate text. The barrier to winning proposals has
          never been text generation. It&rsquo;s strategic thinking applied
          consistently at scale. That&rsquo;s what intent-driven proposals
          deliver &mdash; and that&rsquo;s what separates a winning proposal
          from one that just checks the boxes.
        </p>
      </>
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  Static params for build-time rendering                             */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = POSTS[slug];
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = POSTS[slug];
  if (!post) notFound();

  return (
    <div className="vf-page">
      {/* Nav */}
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/blog">&larr; All Posts</Link>
            <Link href="/about">About</Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <article className="blog-article">
          <div className="blog-article-header">
            <div className="blog-card-tag">{post.tag}</div>
            <h1 className="blog-article-title">{post.title}</h1>
            <div className="blog-article-meta">
              <span>{post.date}</span>
              <span className="blog-article-dot">&bull;</span>
              <span>{post.readTime}</span>
            </div>
          </div>
          <div className="blog-article-body">{post.content}</div>
        </article>

        {/* CTA */}
        <div className="blog-cta">
          <h3>Ready to upgrade your proposal process?</h3>
          <p>
            IntentBid is in invite-only early access. Request a spot and see
            the Intent Framework in action.
          </p>
          <Link href="/request-access" className="about-cta">
            Request Access
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <p>IntentBid &mdash; Proposal intelligence, engineered to win.</p>
        <div className="about-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>
    </div>
  );
}
