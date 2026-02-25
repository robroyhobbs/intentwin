import Link from "next/link";

/**
 * Shared navigation for public marketing pages.
 *
 * Used by: /product, /intelligence-overview, /about, /blog, /blog/[slug]
 *
 * NOT used by: landing page (has anchor links), /request-access (conversion
 * page with minimal nav), /terms, /privacy (legal nav variant).
 */
export function PublicNav() {
  return (
    <nav className="vf-nav">
      <div className="vf-nav-inner">
        <Link href="/" className="vf-logo flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="rounded-md shadow-[0_0_10px_rgba(192,132,252,0.4)]"
          >
            <rect width="512" height="512" rx="100" fill="#09090B" />
            <rect
              x="176"
              y="144"
              width="32"
              height="224"
              rx="16"
              fill="url(#pn_grad_1)"
            />
            <path
              d="M232 144H320C355.346 144 384 172.654 384 208C384 233.167 369.458 254.918 348.65 265.558C374.881 275.64 394 300.911 394 330C394 369.764 361.764 402 322 402H232V144Z"
              stroke="url(#pn_grad_2)"
              strokeWidth="28"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M232 268H320"
              stroke="url(#pn_grad_2)"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <circle cx="192" cy="112" r="16" fill="url(#pn_grad_1)" />
            <circle cx="232" cy="112" r="16" fill="url(#pn_grad_2)" />
            <defs>
              <linearGradient
                id="pn_grad_1"
                x1="176"
                y1="112"
                x2="208"
                y2="368"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#818CF8" />
                <stop offset="1" stopColor="#C084FC" />
              </linearGradient>
              <linearGradient
                id="pn_grad_2"
                x1="232"
                y1="144"
                x2="394"
                y2="402"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#C084FC" />
                <stop offset="1" stopColor="#F472B6" />
              </linearGradient>
            </defs>
          </svg>
          IntentBid
        </Link>
        <div className="vf-nav-links">
          <Link href="/product">Product</Link>
          <Link href="/intelligence-overview">Intelligence</Link>
          <Link href="/government">Government</Link>
          <Link href="/pricing">Pricing</Link>
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
  );
}
