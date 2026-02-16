import { nanoid } from "nanoid";

/**
 * Factory functions for creating test data
 * These ensure consistent test data across all tests
 */

// Types (simplified for testing)
export interface MockOrganization {
  id: string;
  name: string;
  plan_tier: "starter" | "pro" | "business";
  created_at: string;
  updated_at: string;
}

export interface MockUser {
  id: string;
  email: string;
  organization_id: string;
  role: "admin" | "manager" | "member";
  created_at: string;
}

export interface MockProposal {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  client_name: string;
  client_industry?: string;
  status: "draft" | "in_review" | "complete";
  created_at: string;
  updated_at: string;
}

export interface MockDocument {
  id: string;
  organization_id: string;
  title: string;
  document_type: "rfp" | "capability" | "past_performance" | "reference";
  file_path: string;
  processing_status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

/**
 * Create a mock organization
 */
export function createMockOrganization(
  overrides: Partial<MockOrganization> = {}
): MockOrganization {
  return {
    id: nanoid(),
    name: "Test Organization",
    plan_tier: "starter",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock user
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: nanoid(),
    email: "test@example.com",
    organization_id: nanoid(),
    role: "admin",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock proposal
 */
export function createMockProposal(
  overrides: Partial<MockProposal> = {}
): MockProposal {
  return {
    id: nanoid(),
    organization_id: nanoid(),
    title: "Test Proposal",
    description: "A test proposal for unit testing",
    client_name: "Test Client",
    client_industry: "Technology",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock document
 */
export function createMockDocument(
  overrides: Partial<MockDocument> = {}
): MockDocument {
  return {
    id: nanoid(),
    organization_id: nanoid(),
    title: "Test Document",
    document_type: "rfp",
    file_path: `test/${nanoid()}.pdf`,
    processing_status: "completed",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create an array of mock items
 */
export function createMockArray<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides: Partial<T> = {}
): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}

/**
 * Create test context with org and user
 */
export function createTestContext() {
  const org = createMockOrganization();
  const user = createMockUser({ organization_id: org.id });
  
  return {
    organization: org,
    user,
    getUserContext: () => ({
      user: { id: user.id, email: user.email },
      organizationId: org.id,
      role: user.role,
    }),
  };
}
