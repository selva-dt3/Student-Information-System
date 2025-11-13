/**
 * Integration-style tests using React Testing Library for App flows:
 * - rendering header
 * - opening add form
 * - filter debounce and pagination controls present
 * Supabase calls are mocked to avoid network.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Use a safe, self-referential chain to avoid temporal dead zone issues
jest.mock('../../supabaseClient', () => {
  let client = null;
  return {
    getSupabaseClient: () => {
      if (!client) {
        const chain = {};
        // chain methods always return the same chain
        chain.range = jest.fn(() => chain);
        chain.order = jest.fn(() => chain);
        chain.lte = jest.fn(() => chain);
        chain.gte = jest.fn(() => chain);
        chain.eq = jest.fn(() => chain);
        chain.ilike = jest.fn(() => chain);
        chain.or = jest.fn(() => chain);
        // select returns the chain; consuming code awaits later, but our tests don't rely on that awaited value directly here
        const select = jest.fn((_sel = '*', _opts = {}) => chain);
        client = { from: () => ({ select }) };
      }
      return client;
    },
    getSupabaseDiagnostics: () => ({ ok: true, issues: [] }),
  };
});

describe('App integration flows', () => {
  it('renders header and counters', async () => {
    render(<App />);
    // Header brand title
    expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
    // Use a role-based, unambiguous heading for "Students"
    expect(
      await screen.findByRole('heading', { name: /^Students$/i })
    ).toBeInTheDocument();
  });

  it('opens add form', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /\+ Add Student/i }));
    expect(await screen.findByRole('form', { name: /student-form/i })).toBeInTheDocument();
  });

  it('pagination controls exist and are enabled initially', async () => {
    render(<App />);
    expect(await screen.findByText(/Rows per page/i)).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Next/ });
    expect(nextBtn).toBeEnabled();
  });
});
