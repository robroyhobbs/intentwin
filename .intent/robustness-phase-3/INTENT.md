# Phase 3: Security Audit Completion

## Intent

Complete the comprehensive security audit to address remaining vulnerabilities. Remove sensitive data from logs, add request size limits, implement CSRF protection, and ensure all API routes have proper authentication and authorization.

## Problem Statement

Current state:
- 55 console statements need review for sensitive data exposure
- No request size limits (risk of DoS via large payloads)
- No CSRF protection on state-changing routes
- Some API routes may lack proper organization verification
- No input sanitization for user-generated content
- CSP headers present but could be stricter

This creates risk:
- PII or tokens could leak in logs
- Large file uploads can crash server
- CSRF attacks on authenticated routes
- XSS via unsanitized user content

## Goals

1. **Log Sanitization** - Review and sanitize all 55 console statements
2. **Request Size Limits** - Add limits to all API routes
3. **CSRF Protection** - Implement tokens for state-changing routes
4. **Input Sanitization** - Clean user-generated content
5. **Complete Auth Audit** - Verify all routes have proper checks

## Success Criteria

| Check | Current | Target |
|-------|---------|--------|
| Console statements with PII | 55 unknown | 0 |
| Routes with size limits | ~20% | 100% |
| State-changing routes with CSRF | 0% | 100% |
| API routes with auth verification | ~85% | 100% |
| CSP violations | Unknown | 0 |

## Technical Approach

### 1. Console Statement Audit & Sanitization

Create audit script:

```typescript
// scripts/audit-console-statements.ts
import { glob } from "glob";
import { readFileSync } from "fs";

const sensitivePatterns = [
  /console\.(log|debug|info|warn|error)\s*\(/gi,
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /email/i,
  /credit[_-]?card/i,
  /ssn/i
];

async function auditConsoleStatements() {
  const files = await glob("src/**/*.{ts,tsx}");
  const violations: Array<{ file: string; line: number; content: string }> = [];
  
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    
    lines.forEach((line, index) => {
      if (sensitivePatterns[0].test(line)) {
        // Check if line contains sensitive data
        const hasSensitive = sensitivePatterns.slice(1).some(p => p.test(line));
        if (hasSensitive) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      }
    });
  }
  
  console.log(`Found ${violations.length} potential violations:`);
  violations.forEach(v => {
    console.log(`${v.file}:${v.line}: ${v.content}`);
  });
}
```

Replace with structured logging:

```typescript
// BEFORE (vulnerable):
console.log("User login:", { email: user.email, token: user.token });

// AFTER (safe):
logger.info("User login", { 
  userId: user.id, 
  orgId: user.organizationId,
  // DO NOT log: email, token, password
});
```

### 2. Request Size Limits

Add size limits to all API routes:

```typescript
// src/lib/middleware/size-limit.ts
import { NextRequest, NextResponse } from "next/server";

interface SizeLimitConfig {
  maxSize: number;      // in bytes
  endpoint: string;
}

const SIZE_LIMITS: Record<string, number> = {
  default: 1024 * 1024,           // 1MB for general API
  upload: 50 * 1024 * 1024,       // 50MB for file uploads
  export: 10 * 1024 * 1024,       // 10MB for export generation
  ai: 5 * 1024 * 1024             // 5MB for AI prompts
};

export function withSizeLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: keyof typeof SIZE_LIMITS = "default"
) {
  return async (req: NextRequest) => {
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    const maxSize = SIZE_LIMITS[type];
    
    if (contentLength > maxSize) {
      logger.warn("Request size exceeded", {
        endpoint: req.url,
        size: contentLength,
        limit: maxSize,
        orgId: extractOrgId(req)
      });
      
      return NextResponse.json(
        { 
          error: "Request entity too large",
          limit: `${maxSize / (1024 * 1024)}MB`
        },
        { status: 413 }
      );
    }
    
    return handler(req);
  };
}
```

Apply to routes:

```typescript
// src/app/api/documents/upload/route.ts
export const POST = withSizeLimit(
  async (request: NextRequest) => {
    // ... upload logic
  },
  "upload"
);
```

### 3. CSRF Protection

Implement Double Submit Cookie pattern:

```typescript
// src/lib/csrf/csrf-token.ts
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return nanoid(32);
}

export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 // 24 hours
  });
  
  return token;
}

export async function validateCsrfToken(
  request: NextRequest
): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

Middleware for state-changing routes:

```typescript
// src/lib/middleware/csrf-protection.ts
export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Skip for GET/HEAD/OPTIONS (safe methods)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return handler(req);
    }
    
    // Skip for webhook routes (external callers)
    if (req.url.includes("/api/stripe/webhook")) {
      return handler(req);
    }
    
    // Skip for API key auth routes
    if (req.headers.get("authorization")?.startsWith("Bearer ")) {
      return handler(req);
    }
    
    const isValid = await validateCsrfToken(req);
    
    if (!isValid) {
      logger.warn("CSRF validation failed", {
        url: req.url,
        method: req.method,
        ip: req.ip
      });
      
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}
```

Client-side CSRF token injection:

```typescript
// src/hooks/use-csrf.ts
export function useCsrf() {
  const [token, setToken] = useState<string>("");
  
  useEffect(() => {
    // Fetch CSRF token from API on mount
    fetch("/api/csrf/token")
      .then(res => res.json())
      .then(data => setToken(data.token));
  }, []);
  
  const fetchWithCsrf = useCallback(
    async (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "x-csrf-token": token
        }
      });
    },
    [token]
  );
  
  return { token, fetchWithCsrf };
}
```

### 4. Input Sanitization

Sanitize user-generated content:

```typescript
// src/lib/sanitize/input-sanitizer.ts
import DOMPurify from "isomorphic-dompurify";

interface SanitizeConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
}

const DEFAULT_CONFIG: SanitizeConfig = {
  allowedTags: ["b", "i", "em", "strong", "p", "br"],
  allowedAttributes: {}
};

export function sanitizeHtml(
  input: string, 
  config: SanitizeConfig = DEFAULT_CONFIG
): string {
  if (!input) return "";
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: config.allowedTags,
    ALLOWED_ATTR: config.allowedAttributes,
    KEEP_CONTENT: true
  });
}

export function sanitizePlainText(input: string): string {
  if (!input) return "";
  
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, "").trim();
}

export function validateInput(
  input: string,
  rules: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  }
): { valid: boolean; error?: string } {
  if (rules.required && !input) {
    return { valid: false, error: "Input is required" };
  }
  
  if (rules.minLength && input.length < rules.minLength) {
    return { 
      valid: false, 
      error: `Input must be at least ${rules.minLength} characters` 
    };
  }
  
  if (rules.maxLength && input.length > rules.maxLength) {
    return { 
      valid: false, 
      error: `Input must be at most ${rules.maxLength} characters` 
    };
  }
  
  if (rules.pattern && !rules.pattern.test(input)) {
    return { valid: false, error: "Input format is invalid" };
  }
  
  return { valid: true };
}
```

### 5. Complete Authentication Audit

Verify all API routes:

```typescript
// scripts/verify-auth-coverage.ts
import { glob } from "glob";
import { readFileSync } from "fs";

const REQUIRED_PATTERNS = [
  /getUserContext\s*\(/,
  /verifyProposalAccess\s*\(/,
  /verifyDocumentAccess\s*\(/,
  /eq\s*\(\s*['"]organization_id['"]\s*,/
];

async function verifyAuthCoverage() {
  const files = await glob("src/app/api/**/*.ts");
  const issues: Array<{ file: string; missing: string[] }> = [];
  
  for (const file of files) {
    // Skip webhook routes (external auth)
    if (file.includes("webhook")) continue;
    
    const content = readFileSync(file, "utf-8");
    const missing: string[] = [];
    
    // Check for getUserContext
    if (!REQUIRED_PATTERNS[0].test(content)) {
      missing.push("getUserContext");
    }
    
    // Check for organization scoping
    if (!REQUIRED_PATTERNS[3].test(content)) {
      missing.push("organization_id scoping");
    }
    
    if (missing.length > 0) {
      issues.push({ file, missing });
    }
  }
  
  console.log(`Found ${issues.length} routes with potential auth gaps:`);
  issues.forEach(i => {
    console.log(`${i.file}: missing ${i.missing.join(", ")}`);
  });
}
```

### 6. Enhanced CSP Headers

Update vercel.json with stricter CSP:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.gemini.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
}
```

## File Structure

```
src/lib/
├── csrf/
│   ├── csrf-token.ts          # CSRF token generation/validation
│   └── csrf-context.tsx       # React context for CSRF
├── sanitize/
│   └── input-sanitizer.ts     # Input sanitization utilities
└── middleware/
    ├── size-limit.ts          # Request size limiting
    └── csrf-protection.ts     # CSRF protection middleware

scripts/
├── audit-console-statements.ts    # Console audit script
└── verify-auth-coverage.ts        # Auth verification script
```

## Dependencies

```json
{
  "dependencies": {
    "isomorphic-dompurify": "^2.9.0"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5"
  }
}
```

## Testing

```typescript
// __tests__/security/csrf.test.ts
describe("CSRF Protection", () => {
  test("blocks POST without CSRF token", async () => {
    const res = await fetch("/api/proposals", {
      method: "POST",
      body: JSON.stringify({ title: "Test" })
    });
    expect(res.status).toBe(403);
  });
  
  test("allows POST with valid CSRF token", async () => {
    // Get CSRF token first
    const csrfRes = await fetch("/api/csrf/token");
    const { token } = await csrfRes.json();
    
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "x-csrf-token": token },
      body: JSON.stringify({ title: "Test" })
    });
    expect(res.status).toBe(201);
  });
});

// __tests__/security/input-sanitization.test.ts
describe("Input Sanitization", () => {
  test("removes script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const sanitized = sanitizeHtml(input);
    expect(sanitized).not.toContain("<script>");
  });
  
  test("removes onclick handlers", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const sanitized = sanitizeHtml(input);
    expect(sanitized).not.toContain("onclick");
  });
});
```

## Verification Checklist

- [ ] All 55 console statements reviewed
- [ ] Zero PII/tokens in logs
- [ ] All API routes have size limits
- [ ] State-changing routes require CSRF token
- [ ] User input sanitized before storage
- [ ] All API routes verified for auth coverage
- [ ] CSP headers updated and tested
- [ ] Security tests passing
- [ ] Auth audit script created and run

## Success Metrics

Upon completion:
- Zero sensitive data in production logs
- All routes enforce size limits
- CSRF protection active on all state-changing routes
- Input sanitization applied to user content
- 100% of API routes have proper auth verification
- Security headers pass scanner checks
