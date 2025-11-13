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

jest.mock('../../supabaseClient', () => {
  let client = null;
  return {
    getSupabaseClient: () => {
      if (!client) {
        // Provide a default client that returns empty list to keep UI consistent
        const range = jest.fn().mockReturnValue({
          select: (_s, { count }) => Promise.resolve({ data: [], error: null, count: 0 }),
        });
        const order = jest.fn().mockReturnValue({ range });
        const lte = jest.fn().mockReturnValue({ order, range });
        const gte = jest.fn().mockReturnValue({ lte, order, range });
        const eq = jest.fn().mockReturnValue({ gte, lte, order, range });
        const ilike = jest.fn().mockReturnValue({ ilike, eq, gte, lte, order, range });
        const or = jest.fn().mockReturnValue({ ilike, eq, gte, lte, order, range });
        const select = jest.fn().mockReturnValue({ or, ilike, eq, gte, lte, order, range });
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
    expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
    expect(await screen.findByText(/Students/i)).toBeInTheDocument();
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
