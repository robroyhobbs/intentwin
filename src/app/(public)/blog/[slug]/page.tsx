import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicNav } from "../../_components/public-nav";

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
  "bid-no-bid-decision-framework": {
    title:
      "The Bid/No-Bid Decision Framework: Stop Chasing Every RFP",
    date: "February 24, 2026",
    readTime: "8 min read",
    tag: "Strategy",
    metaDescription:
      "A practical 5-factor scoring framework for bid/no-bid decisions. Stop wasting proposal resources on opportunities you won't win.",
    content: (
      <>
        <p>
          The average government proposal costs between $20,000 and $75,000 to
          produce when you factor in labor hours, opportunity cost, and review
          cycles. For a small firm submitting 4-6 proposals per month, that
          represents the single largest investment of staff time outside of
          delivery.
        </p>
        <p>
          Yet most firms make their bid/no-bid decision with gut instinct. The
          CEO sees an opportunity on SAM.gov, gets excited about the contract
          value, and rallies the team. Nobody asks the hard question:{" "}
          <em>do we actually have a realistic chance of winning this?</em>
        </p>
        <p>
          A structured bid/no-bid framework doesn&rsquo;t just save you from
          losing proposals. It redirects your limited resources toward
          opportunities where you have a genuine competitive advantage.
        </p>

        <h2>The 5 factors that predict win probability</h2>
        <p>
          After studying evaluation criteria across hundreds of federal
          solicitations, we identified five factors that consistently predict
          whether a firm will score well. Each maps directly to how Source
          Selection Evaluation Boards (SSEBs) actually rate proposals under FAR
          15.3:
        </p>

        <h3>1. Requirement Match (Weight: 30%)</h3>
        <p>
          How closely does the Statement of Work map to what you actually
          deliver? This isn&rsquo;t about whether you <em>could</em> do the
          work &mdash; it&rsquo;s about whether the SOW reads like a
          description of your existing service offerings. Evaluators score
          technical approach first, and they&rsquo;re looking for specificity,
          not aspiration.
        </p>
        <p>
          <strong>Score high if:</strong> Your existing service lines directly
          address 80%+ of the SOW requirements. You have documented processes
          for the specific work described.
        </p>
        <p>
          <strong>Score low if:</strong> You&rsquo;d need to hire or subcontract
          for key requirements. The SOW describes work you&rsquo;ve done
          informally but never as a primary contract deliverable.
        </p>

        <h3>2. Past Performance (Weight: 25%)</h3>
        <p>
          This is the factor most small firms underestimate. Under FAR 15.305,
          past performance is typically rated on relevance (similar scope, size,
          and complexity) and quality (CPARS ratings, customer references). An
          &ldquo;Exceptional&rdquo; past performance rating on a relevant
          contract can overcome a lower technical score.
        </p>
        <p>
          <strong>Score high if:</strong> You have 2-3 contracts of similar
          scope and dollar value completed in the last 5 years with documented
          positive outcomes. Bonus: relevant CPARS ratings of Satisfactory or
          above.
        </p>
        <p>
          <strong>Score low if:</strong> Your closest relevant contract is more
          than 5 years old, significantly smaller in scope, or in a different
          domain. No CPARS history in the relevant NAICS code.
        </p>

        <h3>3. Capability Alignment (Weight: 20%)</h3>
        <p>
          Beyond whether you can do the work, do you have the infrastructure?
          Evaluators look for certifications (FedRAMP, CMMC, ISO 27001),
          clearances (facility clearance level, individual clearances),
          partnerships (cloud provider competencies, OEM relationships), and
          tools. An SDVOSB with a FedRAMP High ATO and AWS GovCloud Advanced
          Partner status is a fundamentally different bidder than an SDVOSB
          without them.
        </p>

        <h3>4. Timeline Feasibility (Weight: 15%)</h3>
        <p>
          Can you actually staff this project within the required start date?
          Government contracts often require key personnel to be available
          within 30-60 days of award. If your proposed SOC Director is currently
          deployed on another contract through 2027, evaluators will notice.
        </p>
        <p>
          This factor also includes proposal timeline: if the RFP gives 15 days
          to respond and you haven&rsquo;t been tracking this opportunity,
          you&rsquo;re starting from a deficit. The firms that win have usually
          been in pre-RFP capture for months.
        </p>

        <h3>5. Strategic Value (Weight: 10%)</h3>
        <p>
          Does this contract advance your company&rsquo;s strategic position?
          A $500K contract that gives you your first CPARS rating in
          cybersecurity might be worth more than a $2M contract in a domain you
          don&rsquo;t plan to grow. Strategic value includes: new past
          performance in a target NAICS code, a new agency relationship, a new
          contract vehicle position, or a teaming arrangement with a desired
          prime.
        </p>

        <h2>How to score: a practical example</h2>
        <p>
          Let&rsquo;s say you&rsquo;re a 40-person SDVOSB IT services firm
          based in the DC metro area. A new RFP drops for cybersecurity
          monitoring services at USDA:
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Factor</th>
              <th style={{ textAlign: "center", padding: "0.5rem" }}>Weight</th>
              <th style={{ textAlign: "center", padding: "0.5rem" }}>Score</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>Requirement Match</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>30%</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>85</td>
              <td style={{ padding: "0.5rem" }}>SOW closely mirrors our managed SOC service. We run Splunk SIEM for 3 current clients.</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>Past Performance</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>25%</td>
              <td style={{ padding: "0.5rem", textAlign: "center" }}>90</td>
              <td style={{ padding: "0.5rem" }}>Two similar SOC contracts in last 3 years, both rated &ldquo;Very Good&rdquo; in CPARS.</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>Capability Alignment</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>20%</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>80</td>
              <td style={{ padding: "0.5rem" }}>CMMC Level 2, SOC 2 Type II, CrowdStrike partnership. Missing FedRAMP High ATO on our platform.</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>Timeline Feasibility</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>15%</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>75</td>
              <td style={{ padding: "0.5rem" }}>30-day response window is tight. Key personnel available but bench is thin.</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>Strategic Value</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>10%</td>
              <td style={{ textAlign: "center", padding: "0.5rem" }}>85</td>
              <td style={{ padding: "0.5rem" }}>First USDA contract would open a new agency relationship. Aligns with growth strategy.</td>
            </tr>
          </tbody>
        </table>

        <p>
          <strong>Weighted total: 84.5/100 &mdash; Recommendation: Bid.</strong>
        </p>
        <p>
          That&rsquo;s not a guarantee of a win. But it tells you this
          opportunity is worth investing $30K-$50K in proposal development
          resources. Compare that to a score of 42 on an opportunity where your
          past performance is in a different domain and you don&rsquo;t hold the
          required certifications &mdash; that&rsquo;s $30K you should spend on
          something else.
        </p>

        <h2>The three recommendation tiers</h2>
        <ul>
          <li>
            <strong>Above 70: Bid.</strong> Strong alignment across factors.
            Invest full proposal resources including color team reviews.
          </li>
          <li>
            <strong>40-70: Evaluate.</strong> Mixed signals. Consider whether a
            teaming arrangement or subcontractor could fill gaps. May be worth
            pursuing if strategic value is high.
          </li>
          <li>
            <strong>Below 40: Pass.</strong> Significant gaps in multiple
            factors. Your resources are better deployed elsewhere. Track the
            award to learn who won and why.
          </li>
        </ul>

        <h2>Common mistakes in bid/no-bid decisions</h2>
        <p>
          <strong>Chasing contract value.</strong> A $50M contract you have a 5%
          chance of winning has an expected value of $2.5M. A $5M contract you
          have a 60% chance of winning has an expected value of $3M &mdash; and
          costs far less to pursue.
        </p>
        <p>
          <strong>Ignoring incumbent advantage.</strong> If the incumbent has
          been delivering for 5 years with no performance issues, you need a
          compelling reason to believe the agency wants to switch. Check USAspending.gov
          for contract history and look for signals: shortened option periods,
          new requirements not in the original scope, or a recompete structured
          as full and open vs. sole source.
        </p>
        <p>
          <strong>Bidding solo when you should team.</strong> If your capability
          alignment score is low but requirement match and strategic value are
          high, a teaming arrangement with a firm that fills your gaps can shift
          the math entirely. A well-structured JV or sub-to relationship
          can turn a &ldquo;pass&rdquo; into a &ldquo;bid.&rdquo;
        </p>

        <h2>Automating the framework</h2>
        <p>
          The framework above is simple enough to run in a spreadsheet. But doing
          it well requires pulling together information that lives in different
          places: your past performance database, your certifications list, your
          personnel availability, the solicitation requirements, and competitive
          intelligence about who else might bid.
        </p>
        <p>
          IntentBid automates this scoring by cross-referencing your company
          profile (capabilities, certifications, past performance, team
          clearances) against extracted RFP requirements. Upload or paste the
          solicitation, and you get a scored bid/no-bid recommendation in under
          60 seconds &mdash; with rationale for each factor and procurement
          intelligence from historical award data.
        </p>
        <p>
          The goal isn&rsquo;t to remove human judgment. It&rsquo;s to make sure
          human judgment is informed by data, not just enthusiasm.
        </p>
      </>
    ),
  },

  "why-we-built-intentbid": {
    title: "Why We Built IntentBid",
    date: "February 20, 2026",
    readTime: "7 min read",
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
          The real problem is threefold:
        </p>
        <ol>
          <li>
            <strong>Proposal quality is inconsistent.</strong> When your best
            capture manager writes, you win. When anyone else does, it&rsquo;s a
            coin flip.
          </li>
          <li>
            <strong>Institutional knowledge is trapped in people&rsquo;s heads.</strong>{" "}
            Your VA case study from 2023 exists in a SharePoint folder somewhere.
            Your CMMC certification details are in an email thread. Your key
            differentiators change depending on who you ask.
          </li>
          <li>
            <strong>Persuasion is applied by feel, not by system.</strong> Win
            themes show up in the exec summary, then vanish. Evidence is
            mentioned but not proven. The proposal tells the evaluator
            you&rsquo;re qualified instead of showing them.
          </li>
        </ol>

        <h2>What we wanted to exist</h2>
        <p>
          We wanted a system that does what the best capture teams do &mdash; but
          systematically:
        </p>
        <ul>
          <li>
            <strong>Start with a bid/no-bid decision</strong> &mdash; Score every
            opportunity against your actual capabilities before spending a dollar
            on proposal development
          </li>
          <li>
            <strong>Extract requirements automatically</strong> &mdash; Pull
            evaluation criteria, compliance requirements, and key personnel needs
            directly from the RFP document
          </li>
          <li>
            <strong>Apply institutional knowledge</strong> &mdash; Every proposal
            draws from a verified knowledge base of your past performance, case
            studies, certifications, and team qualifications
          </li>
          <li>
            <strong>Generate strategic sections, not filler</strong> &mdash;
            Each section is built from win themes specific to this opportunity,
            backed by evidence selected for relevance to this evaluator
          </li>
        </ul>
        <p>
          Here&rsquo;s what that looks like in practice. For a recent cloud
          migration RFP, IntentBid generated an executive summary opening that
          referenced the specific agency&rsquo;s legacy environment, cited a
          directly relevant past performance (340 servers migrated for a
          comparable federal agency), and quantified the outcome ($3.2M in
          annual savings, 42% reduction in operating costs) &mdash; all pulled
          automatically from the company&rsquo;s evidence library. No copy-paste.
          No hunting through old proposals.
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
          experts are also their proposal writers. Their competitive intelligence
          lives in a shared drive somewhere. Their win themes change from
          proposal to proposal because there&rsquo;s no system to enforce
          consistency.
        </p>
        <p>
          The federal government awards roughly 25% of all contract dollars to
          small businesses &mdash; that&rsquo;s over $178 billion in FY2024
          alone, according to the SBA. Programs like 8(a), SDVOSB, WOSB, and
          HUBZone set-asides exist specifically to create opportunities for
          these firms. But a set-aside doesn&rsquo;t write your proposal for
          you.
        </p>
        <p>
          IntentBid gives these firms the proposal capability of a company ten
          times their size. That&rsquo;s the mission.
        </p>

        <h2>Where we are today</h2>
        <p>
          IntentBid is live and processing real proposals. The platform includes
          automated RFP extraction, bid/no-bid scoring with procurement
          intelligence, 10-section proposal generation backed by your company
          context, and export to DOCX, PDF, and PPTX for color team reviews.
        </p>
        <p>
          We&rsquo;re working closely with initial customers to refine the system
          and build what matters most. If you&rsquo;re tired of watching
          proposals go out the door knowing they could be better &mdash;
          we&rsquo;d love to talk.
        </p>
      </>
    ),
  },

  "smb-government-contracts": {
    title:
      "How Small and Mid-Market Firms Can Compete for Government Contracts",
    date: "February 18, 2026",
    readTime: "8 min read",
    tag: "Strategy",
    metaDescription:
      "You don't need a 50-person capture team to win federal contracts. A practical guide with real numbers, contract vehicles, and strategies for SMBs.",
    content: (
      <>
        <p>
          The federal government spent $759 billion on contracts in FY2024. By
          law, 23% of prime contract dollars must go to small businesses &mdash;
          a target the government has met or exceeded for 11 consecutive years.
          That&rsquo;s real money: over $178 billion awarded to small businesses
          in a single fiscal year.
        </p>
        <p>
          But here&rsquo;s what the optimistic stats don&rsquo;t tell you: the
          vast majority of that $178 billion goes to a relatively small number
          of experienced small businesses. If you&rsquo;re an SMB trying to
          break in or grow your government book of business, you&rsquo;re
          competing against firms that have been doing this for decades.
        </p>
        <p>
          The good news: the playing field is more level than it looks, if you
          know where to focus.
        </p>

        <h2>The set-aside landscape: know your programs</h2>
        <p>
          The SBA administers several contracting programs that reserve specific
          opportunities for qualifying small businesses. Understanding which
          programs you qualify for is step one:
        </p>
        <ul>
          <li>
            <strong>Small Business Set-Aside</strong> &mdash; For any business
            meeting SBA size standards for its NAICS code. Most services firms
            under $16.5M in average annual revenue qualify. This is the broadest
            category.
          </li>
          <li>
            <strong>8(a) Business Development</strong> &mdash; For socially and
            economically disadvantaged small businesses. Provides access to sole-source
            contracts up to $4.5M (services) without competition.
          </li>
          <li>
            <strong>Service-Disabled Veteran-Owned Small Business (SDVOSB)</strong>{" "}
            &mdash; For firms owned and controlled by service-disabled veterans.
            Both VA-specific (Veterans First) and government-wide set-asides.
          </li>
          <li>
            <strong>Women-Owned Small Business (WOSB/EDWOSB)</strong> &mdash;
            For women-owned firms in industries where women are underrepresented.
            Sole-source authority up to $5M for services.
          </li>
          <li>
            <strong>HUBZone</strong> &mdash; For firms headquartered in
            Historically Underutilized Business Zones with 35% of employees
            residing in HUBZones. 10% price evaluation preference on full-and-open
            competitions.
          </li>
        </ul>
        <p>
          Many firms qualify for multiple programs. An 8(a)-certified SDVOSB in a
          HUBZone has access to the widest range of set-aside opportunities.
          Check your eligibility at{" "}
          <strong>certify.sba.gov</strong>.
        </p>

        <h2>Contract vehicles: your entry points</h2>
        <p>
          Government agencies prefer buying from pre-vetted contract vehicles
          rather than running open-market competitions for every purchase. Getting
          on the right vehicle is often more important than finding individual
          RFPs:
        </p>
        <ul>
          <li>
            <strong>GSA Multiple Award Schedule (MAS)</strong> &mdash; The
            broadest government-wide vehicle. Covers IT, professional services,
            facilities, and more. Evaluated on a pass/fail basis; once
            you&rsquo;re on, agencies can buy from you directly.
          </li>
          <li>
            <strong>NASA SEWP VI</strong> &mdash; IT products and services.
            Highly used by civilian agencies despite the NASA branding. One of
            the fastest procurement vehicles in government.
          </li>
          <li>
            <strong>NIH CIO-SP4</strong> &mdash; IT services for health and
            science agencies. Small business pools are specifically reserved.
          </li>
          <li>
            <strong>OASIS+</strong> &mdash; Professional services across all
            domains. Multiple small business pools. High ceiling, long period of
            performance.
          </li>
          <li>
            <strong>Agency-specific BPAs and IDIQs</strong> &mdash; Every major
            agency runs its own vehicles. DHS EAGLE II, DoD ENCORE III, VA T4NG.
            These are often the highest-value opportunities for small firms.
          </li>
        </ul>

        <h2>The capture team gap &mdash; and how to close it</h2>
        <p>
          A typical large defense contractor has dedicated roles for every phase
          of proposal development: capture managers, proposal coordinators,
          volume leads, technical writers, pricing analysts, and review teams.
          They follow Shipley methodology, running Pink Team, Red Team, and
          Gold Team reviews before anything ships.
        </p>
        <p>
          A 30-person IT services firm? Their proposal process looks more like
          this: the CEO finds an opportunity on SAM.gov, forwards it to two
          engineers who have client work due the same week, and someone pulls an
          old proposal from a shared folder to use as a &ldquo;template.&rdquo;
        </p>
        <p>
          The capability gap isn&rsquo;t in what these firms can deliver.
          It&rsquo;s in how they present it. Here&rsquo;s how to close that gap
          without hiring a 10-person proposal shop:
        </p>
        <ol>
          <li>
            <strong>Build your evidence library before you need it.</strong>{" "}
            Document every contract: scope, outcomes, metrics, client
            testimonials. When an RFP drops, you should be selecting evidence,
            not creating it.
          </li>
          <li>
            <strong>Run a bid/no-bid score on every opportunity.</strong> Rate
            each RFP against your capabilities, past performance, and strategic
            goals. Only pursue opportunities scoring above 60. (See our{" "}
            <Link href="/blog/bid-no-bid-decision-framework">bid/no-bid
            framework</Link> for the full methodology.)
          </li>
          <li>
            <strong>Invest in compliance before creativity.</strong> Map every
            Section L instruction and Section M evaluation criterion before
            writing a word. The fastest way to lose is to miss a mandatory
            requirement.
          </li>
          <li>
            <strong>Use AI for assembly, not invention.</strong> The best use of
            AI in proposals is combining your real past performance, real
            certifications, and real team qualifications into well-structured
            sections &mdash; not generating fictional capabilities.
          </li>
        </ol>

        <h2>The math that actually matters</h2>
        <p>
          Consider a firm that currently submits 4 proposals per month with a
          15% win rate at an average contract value of $500K. That&rsquo;s $300K
          in monthly contract wins, roughly $3.6M annually.
        </p>
        <p>
          Now imagine improving two variables: you double your submission rate by
          reducing proposal development time, and you improve your win rate from
          15% to 25% by only pursuing opportunities where you score well on
          bid/no-bid and by improving proposal quality. That&rsquo;s 8 proposals
          per month at 25% = 2 wins/month at $500K = $1M/month, $12M annually.
        </p>
        <p>
          That&rsquo;s not a marginal improvement. That&rsquo;s a different
          business. And neither variable requires hiring &mdash; it requires
          better process and better tools.
        </p>
      </>
    ),
  },

  "problem-with-proposal-templates": {
    title: "The Problem with Proposal Templates",
    date: "February 14, 2026",
    readTime: "6 min read",
    tag: "Insights",
    metaDescription:
      "Templates promise efficiency but deliver mediocrity. See a real side-by-side comparison of template-based vs. intent-driven proposal content.",
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
          framing, and its assumptions. The new RFP has different evaluation
          criteria weighted differently. If the last RFP weighted Technical
          Approach at 40% and this one weights Past Performance at 40%, your
          template is optimized for the wrong thing.
        </p>
        <p>
          <strong>2. They dilute persuasion over time.</strong> Each time a
          template is reused, the original persuasive intent degrades. A case
          study that was selected because it directly mirrored Client A&rsquo;s
          environment becomes the default case study for every proposal. Win
          themes written for a DoD audience get recycled for a civilian agency
          that cares about different things. By the fourth reuse, nothing in the
          proposal is tailored to anything.
        </p>
        <p>
          <strong>3. They create a false sense of completeness.</strong> A
          filled-in template looks like a finished proposal. Every section has
          content. But &ldquo;has content&rdquo; and &ldquo;makes a compelling
          case&rdquo; are very different things. Evaluators can tell the
          difference immediately &mdash; and they see hundreds of
          template-recycled proposals every year.
        </p>

        <h2>What template decay looks like</h2>
        <p>
          Here&rsquo;s a real example. This is a typical executive summary
          opening from a proposal that started as a template:
        </p>
        <blockquote style={{ borderLeft: "3px solid var(--border)", paddingLeft: "1rem", margin: "1.5rem 0", color: "var(--foreground-muted)" }}>
          <p>
            &ldquo;[Company Name] is pleased to submit this proposal in response
            to [Agency]&rsquo;s requirement for [service]. With over [X] years
            of experience providing [general capability], we are uniquely
            qualified to support [Agency]&rsquo;s mission. Our team of certified
            professionals brings deep expertise in [domain] and a proven track
            record of delivering results for federal clients.&rdquo;
          </p>
        </blockquote>
        <p>
          Every bracket is a tell. This paragraph says nothing specific. It
          makes no claim the evaluator can verify. It describes no outcome. It
          reads exactly like what it is: a mad-libs template.
        </p>
        <p>
          Now compare this to an executive summary opening written with intent
          &mdash; meaning it starts from the specific evaluation criteria,
          applies the company&rsquo;s strongest relevant evidence, and leads
          with a verifiable outcome:
        </p>
        <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "1rem", margin: "1.5rem 0" }}>
          <p>
            &ldquo;When the Department of Veterans Affairs needed to migrate 340
            production servers from legacy on-premises infrastructure to AWS
            GovCloud &mdash; with zero tolerance for data loss and a
            congressional mandate for completion within 18 months &mdash; they
            selected Apex Federal Solutions. We delivered in 16 months, achieved
            zero data loss across 2.1 petabytes, and reduced the VA&rsquo;s
            infrastructure operating costs by $3.2M annually. We propose to
            bring the same methodology, the same team leadership, and the same
            commitment to measurable outcomes to [Agency]&rsquo;s cloud
            modernization initiative.&rdquo;
          </p>
        </blockquote>
        <p>
          Same word count. Fundamentally different impact. The second version
          opens with proof, not promises. Every claim is specific and
          verifiable. The evaluator learns more in two sentences than the
          template version communicates in an entire section.
        </p>

        <h2>What works instead</h2>
        <p>
          The alternative isn&rsquo;t starting from a blank page every time.
          That&rsquo;s even worse. The alternative is starting from
          <em> intent</em>.
        </p>
        <p>
          Before any text is generated, you need to answer three questions:
        </p>
        <ol>
          <li>What does this evaluator need to believe to score us highest?</li>
          <li>What are our three strongest differentiators for <em>this specific</em> opportunity?</li>
          <li>What evidence do we have that proves each claim?</li>
        </ol>
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
          That&rsquo;s a real constraint. A good technical approach section
          might take 8-12 hours to write well. Multiply by 10 sections and
          you&rsquo;re looking at a two-week effort from a senior person.
        </p>
        <p>
          But the answer isn&rsquo;t to accept mediocre starting points. The
          answer is to make good starting points fast. A system that
          knows your company&rsquo;s capabilities, selects relevant evidence
          automatically, and structures each section around win themes specific
          to this opportunity &mdash; that&rsquo;s not a template. That&rsquo;s
          a proposal engineered to win.
        </p>
      </>
    ),
  },

  "intent-driven-proposals": {
    title: "Intent-Driven Proposals: Strategy Before Writing",
    date: "February 10, 2026",
    readTime: "8 min read",
    tag: "Product",
    metaDescription:
      "Most proposal tools start with a blank page. IntentBid starts with intent. See a worked example of how strategy-first proposals outperform template-first ones.",
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
        <p>
          Intent isn&rsquo;t a prompt. It&rsquo;s a data model. When you upload
          an RFP, IntentBid extracts:
        </p>
        <ul>
          <li>
            <strong>Client context</strong> &mdash; The agency, their current
            environment, their stated pain points, and their evaluation criteria
            with weights
          </li>
          <li>
            <strong>Compliance requirements</strong> &mdash; Every mandatory
            requirement from Sections L and M, mapped to the section where it
            must be addressed
          </li>
          <li>
            <strong>Win themes</strong> &mdash; Generated by analyzing your
            company&rsquo;s strengths against this specific opportunity&rsquo;s
            requirements. Not generic differentiators &mdash; the 3-5 reasons{" "}
            <em>you</em> should win <em>this</em> contract
          </li>
          <li>
            <strong>Evidence mapping</strong> &mdash; Which past performance
            contracts, case studies, metrics, and team qualifications support
            each win theme
          </li>
        </ul>

        <h2>A worked example</h2>
        <p>
          Let&rsquo;s walk through a real scenario. A 40-person SDVOSB uploads
          an RFP for a DLA cloud migration contract worth $8.2M. Here&rsquo;s
          what happens:
        </p>

        <h3>Step 1: Extraction</h3>
        <p>
          IntentBid parses the RFP and extracts structured data: the agency
          (Defense Logistics Agency), contract value ($8.2M), period of
          performance (base + 4 option years), NAICS code (541512), and set-aside
          type (SDVOSB). It also extracts 12 key requirements, 5 evaluation
          criteria with weights, and 8 compliance items.
        </p>

        <h3>Step 2: Bid/No-Bid Scoring</h3>
        <p>
          The system scores the opportunity against the company&rsquo;s profile.
          Result: 85.5 out of 100. Requirement match is strong (the firm has a
          cloud migration practice), past performance is excellent (two similar
          federal migrations in the last 3 years), and the SDVOSB set-aside
          reduces competition. Recommendation: <strong>Bid</strong>.
        </p>

        <h3>Step 3: Intent Definition</h3>
        <p>
          Based on the scoring analysis, IntentBid generates win themes:
        </p>
        <ol>
          <li>
            <strong>Proven migration methodology</strong> &mdash; The
            firm&rsquo;s proprietary 4-phase migration framework has delivered
            zero-data-loss outcomes across 340+ server migrations
          </li>
          <li>
            <strong>Cleared, experienced team</strong> &mdash; All proposed key
            personnel hold active TS-SCI clearances and have delivered similar
            work for DoD agencies
          </li>
          <li>
            <strong>Cost savings track record</strong> &mdash; Previous
            migrations have delivered 35-42% infrastructure cost reductions with
            documented ROI
          </li>
        </ol>

        <h3>Step 4: Section Generation</h3>
        <p>
          Each section is generated with the intent context embedded. The
          executive summary leads with the VA migration outcome. The technical
          approach describes the migration methodology with phase-specific
          details. The past performance section selects the two most relevant
          contracts and presents them in the STAR format (Situation, Task,
          Action, Result) that evaluators are trained to assess.
        </p>
        <p>
          The cover letter references DLA specifically &mdash; not a generic
          agency placeholder. The team section lists actual personnel with their
          specific clearances, certifications, and relevant project history. The
          pricing section is informed by GSA CALC+ rate benchmarks for the
          relevant labor categories.
        </p>

        <h3>The result</h3>
        <p>
          A 10-section proposal where every paragraph serves a strategic
          purpose. Win themes appear in the exec summary, are reinforced in
          the technical approach, backed by evidence in past performance, and
          echoed in the closing &ldquo;Why Us&rdquo; section. Nothing is
          generic. Nothing is recycled from a different bid.
        </p>

        <h2>Why strategy before writing matters</h2>
        <p>
          Government evaluators typically score proposals using adjectival
          ratings: Outstanding, Good, Acceptable, Marginal, Unacceptable. The
          difference between &ldquo;Good&rdquo; and &ldquo;Outstanding&rdquo;
          isn&rsquo;t word count or polish. It&rsquo;s whether the proposal
          demonstrates clear understanding of the requirement and offers
          specific, measurable strengths that exceed the requirement.
        </p>
        <p>
          You can&rsquo;t exceed the requirement if you haven&rsquo;t precisely
          identified it. You can&rsquo;t demonstrate specific strengths if you
          haven&rsquo;t mapped your evidence to their criteria. You can&rsquo;t
          be persuasive if you start writing before you&rsquo;ve defined your
          strategy.
        </p>
        <p>
          That&rsquo;s the core insight: the quality of a proposal is
          determined before any text is written. Intent-driven proposals
          codify that insight into a repeatable system.
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
      <PublicNav />

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
