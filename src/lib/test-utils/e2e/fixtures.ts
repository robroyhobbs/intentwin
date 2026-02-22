/**
 * E2E Test Fixtures
 * 
 * Test data and fixtures for end-to-end tests
 */

import { createMockOrganization, createMockProposal } from "../test-data";

/**
 * Test users for E2E tests
 * These should match test accounts created in Supabase
 */
export const testUsers = {
  admin: {
    email: "test-admin@intentbid.test",
    password: "TestPassword123!",
    organization: createMockOrganization({ name: "Test Admin Org" }),
  },
  manager: {
    email: "test-manager@intentbid.test",
    password: "TestPassword123!",
    organization: createMockOrganization({ name: "Test Manager Org" }),
  },
  member: {
    email: "test-member@intentbid.test",
    password: "TestPassword123!",
    organization: createMockOrganization({ name: "Test Member Org" }),
  },
};

/**
 * Test proposals for E2E tests
 */
export const testProposals = {
  draft: createMockProposal({
    title: "E2E Test Draft Proposal",
    client_name: "E2E Test Client",
    status: "draft",
  }),
  inReview: createMockProposal({
    title: "E2E Test In-Review Proposal",
    client_name: "E2E Test Client",
    status: "in_review",
  }),
  complete: createMockProposal({
    title: "E2E Test Complete Proposal",
    client_name: "E2E Test Client",
    status: "complete",
  }),
};

/**
 * Test file paths (relative to project root)
 * These files should exist in __tests__/e2e/fixtures/
 */
export const testFiles = {
  samplePDF: "__tests__/e2e/fixtures/sample-rfp.pdf",
  sampleDOCX: "__tests__/e2e/fixtures/sample-capability.docx",
  largeFile: "__tests__/e2e/fixtures/large-document.pdf",
  invalidFile: "__tests__/e2e/fixtures/invalid.exe",
};

/**
 * Setup data for auth.setup.ts
 */
export const authSetupData = {
  storageState: "__tests__/e2e/.auth/user.json",
  baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
};
