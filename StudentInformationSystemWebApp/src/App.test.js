import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders app header and add button', () => {
  render(<App />);
  expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\+ Add Student/i })).toBeInTheDocument();
});

test('can open the add form', async () => {
  render(<App />);
  const user = userEvent.setup();
  const addBtn = screen.getByRole('button', { name: /\+ Add Student/i });
  await user.click(addBtn);
  // Await the form to appear using findByRole to avoid act warnings
  expect(await screen.findByRole('form', { name: /student-form/i })).toBeInTheDocument();
});
