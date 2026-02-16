import { vi } from "vitest";

/**
 * Creates a mock Supabase client with chainable methods
 * Returns an object that can be used to mock Supabase queries
 */
export function createMockSupabaseClient() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  
  // Common Supabase query methods
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", 
    "in", "is", "like", "ilike",
    "order", "limit", "range", "single", "maybeSingle",
    "match", "contains", "containedBy", "overlaps"
  ];
  
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  
  // Mock the promise-like behavior
  chain.then = vi.fn((callback: (result: { data: unknown; error: null }) => unknown) => {
    return Promise.resolve(callback({ data: null, error: null }));
  });
  
  return chain;
}

/**
 * Creates a mock Supabase auth client
 */
export function createMockSupabaseAuth() {
  return {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  };
}

/**
 * Creates a complete mock Supabase client (admin + auth)
 */
export function createMockSupabase() {
  const mockQuery = createMockSupabaseClient();
  
  return {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn(() => mockQuery),
    auth: createMockSupabaseAuth(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
    // Allow direct access to query chain for assertions
    _query: mockQuery,
  };
}

/**
 * Helper to set mock return values for Supabase queries
 * Usage:
 * const { setMockData } = mockSupabase;
 * setMockData('proposals', [{ id: '1', title: 'Test' }]);
 */
export function createMockSupabaseWithHelpers() {
  const mockData: Record<string, unknown> = {};
  const mockQuery = createMockSupabaseClient();
  
  const mockSupabase = {
    from: vi.fn((table: string) => {
      const chain = { ...mockQuery };
      
      // Override .then to return mock data for this table
      chain.then = vi.fn((callback: (result: { data: unknown; error: null }) => unknown) => {
        return Promise.resolve(callback({ 
          data: mockData[table] || null, 
          error: null 
        }));
      });
      
      return chain;
    }),
    rpc: vi.fn(() => mockQuery),
    auth: createMockSupabaseAuth(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
    // Helper to set mock data
    setMockData: (table: string, data: unknown) => {
      mockData[table] = data;
    },
    // Helper to reset all mocks
    resetMocks: () => {
      Object.keys(mockData).forEach((key) => delete mockData[key]);
      vi.clearAllMocks();
    },
  };
  
  return mockSupabase;
}
