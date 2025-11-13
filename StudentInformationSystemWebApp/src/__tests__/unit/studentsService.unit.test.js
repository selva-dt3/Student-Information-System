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
    const range = jest.fn().mockReturnValue({
      select: (_star, { count }) => Promise.resolve({ data: [{ id: '1', first_name: 'John', last_name: 'Z', email: 'j@x.com' }], error: null, count: 1 }),
    });
    const order = jest.fn().mockReturnValue({ range });
    const lte = jest.fn().mockReturnValue({ order, range });
    const gte = jest.fn().mockReturnValue({ lte, order, range });
    const eq = jest.fn().mockReturnValue({ gte, lte, order, range });
    const ilike = jest.fn().mockReturnValue({ ilike, eq, gte, lte, order, range });
    const or = jest.fn().mockReturnValue({ ilike, eq, gte, lte, order, range });
    const select = jest.fn().mockReturnValue({ or, ilike, eq, gte, lte, order, range });
    const from = () => ({ select });

    supabaseClientModule.__setClient({ from });

    const res = await listStudentsFiltered(
      { q: 'john', first_name: 'Jo' },
      { page: 1, pageSize: 10, sortBy: 'last_name', sortDir: 'asc', withCount: true }
    );

    expect(res.total).toBe(1);
    expect(res.data).toHaveLength(1);
    expect(select).toHaveBeenCalled();
    expect(order).toHaveBeenCalledWith('last_name', { ascending: true });
  });
});
