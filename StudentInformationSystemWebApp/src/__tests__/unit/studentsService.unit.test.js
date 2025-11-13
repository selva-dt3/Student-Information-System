/**
 * Unit tests for studentsService: validation and error handling.
 */
import {
  validateStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  listStudentsFiltered,
} from '../../services/studentsService';

// Mock supabaseClient module to avoid real network calls
jest.mock('../../supabaseClient', () => {
  let client = null;
  return {
    getSupabaseClient: () => {
      if (!client) {
        throw new Error('Supabase client not initialized');
      }
      return client;
    },
    getSupabaseDiagnostics: () => ({ ok: false, issues: ['mocked missing env'] }),
    __setClient: (c) => { client = c; },
    __reset: () => { client = null; },
  };
});

const supabaseClientModule = require('../../supabaseClient');

beforeEach(() => {
  supabaseClientModule.__reset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('validateStudent', () => {
  it('requires first_name, last_name, email', () => {
    const res = validateStudent({});
    expect(res.valid).toBe(false);
    expect(res.errors.first_name).toBe('Required');
    expect(res.errors.last_name).toBe('Required');
    expect(res.errors.email).toBe('Required');
  });

  it('rejects invalid email and date formats', () => {
    const res = validateStudent({
      first_name: 'A',
      last_name: 'B',
      email: 'not-an-email',
      date_of_birth: '12/01/2020',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.email).toBeDefined();
    expect(res.errors.date_of_birth).toBeDefined();
  });

  it('accepts minimal valid record', () => {
    const res = validateStudent({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual({});
  });
});

describe('Supabase error handling', () => {
  it('addStudent throws friendly message on uniqueness violation', async () => {
    const insert = jest.fn().mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'duplicate key value violates unique constraint "students_email_key"' } }) }),
    });
    const from = () => ({ insert });
    supabaseClientModule.__setClient({ from });

    await expect(addStudent({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
    })).rejects.toThrow(/Email already exists/i);
  });

  it('updateStudent surfaces generic failure on supabase error', async () => {
    const update = jest.fn().mockReturnValue({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'permission denied by RLS' } }) }) }),
    });
    const from = () => ({ update });
    supabaseClientModule.__setClient({ from });

    await expect(updateStudent('id-1', {
      first_name: 'A', last_name: 'B', email: 'a@b.com'
    })).rejects.toThrow(/Failed to update student/);
  });

  it('deleteStudent throws on supabase error', async () => {
    const del = jest.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: { message: 'not allowed' } }),
    });
    const from = () => ({ delete: del });
    supabaseClientModule.__setClient({ from });

    await expect(deleteStudent('id-1')).rejects.toThrow(/Failed to delete student/);
  });

  it('listStudentsFiltered respects filters, ordering, and returns shape', async () => {
    // Build a single chain object to avoid temporal dead zone and allow full chaining
    const chain = {};
    // terminal resolution for select with count support
    const selectReturn = Promise.resolve({
      data: [{ id: '1', first_name: 'John', last_name: 'Z', email: 'j@x.com' }],
      error: null,
      count: 1,
    });

    chain.range = jest.fn(() => chain);
    chain.order = jest.fn(() => chain);
    chain.lte = jest.fn(() => chain);
    chain.gte = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.ilike = jest.fn(() => chain);
    chain.or = jest.fn(() => chain);

    // select returns the same chain; when studentsService awaits with select('*', { count: 'exact' }),
    // it should get back an object like { data, error, count }. To support both patterns:
    const select = jest.fn((_sel = '*', _opts = {}) => {
      // When called as await query.select(...), return a resolvable thenable.
      // We attach a then method on chain to resolve to selectReturn if awaited directly.
      return chain;
    });

    // Add then to chain to make awaiting the chain resolve to a select-like return when needed
    // This mimics a thenable; however, in our service the await is on the select(...) call result.
    // Provide a minimal then to satisfy await semantics if used.
    // eslint-disable-next-line no-underscore-dangle
    chain.then = undefined;

    const from = () => ({ select });

    supabaseClientModule.__setClient({ from });

    const res = await listStudentsFiltered(
      { q: 'john', first_name: 'Jo' },
      { page: 1, pageSize: 10, sortBy: 'last_name', sortDir: 'asc', withCount: true }
    );

    // Validate result shape
    expect(res.total).toBe(1);
    expect(res.data).toHaveLength(1);
    // Ensure select called at least once
    expect(select).toHaveBeenCalled();
    // Ensure we ordered by a whitelisted column
    expect(chain.order).toHaveBeenCalledWith('last_name', { ascending: true });
  });
});
