/// PUBLIC_INTERFACE
/**
 * Provides helpers to mock supabase client used by services in unit/integration tests.
 * Usage:
 *   const { mockGetSupabaseClient, resetSupabaseMock } = require('../test-utils/supabaseMock');
 *   beforeEach(resetSupabaseMock);
 *   mockGetSupabaseClient({ from: () => ({ select: jest.fn() ... }) });
 */
export const mockModules = {
  '../supabaseClient': {},
};

let currentMock = null;

// PUBLIC_INTERFACE
export function mockGetSupabaseClient(client) {
  /** Inject a mock Supabase client object that mirrors the minimal methods used. */
  currentMock = client;
}

// PUBLIC_INTERFACE
export function resetSupabaseMock() {
  /** Reset the active mock to avoid cross-test contamination. */
  currentMock = null;
}

// Provide a Jest module factory for ../supabaseClient
// CRA jest will resolve this via jest.mock calls in tests.
export function __getCurrentMock() {
  return currentMock;
}
