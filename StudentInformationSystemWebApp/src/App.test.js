import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header and add button', () => {
  render(<App />);
  expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\+ Add Student/i })).toBeInTheDocument();
});

test('can open the add form', () => {
  render(<App />);
  const addBtn = screen.getByRole('button', { name: /\+ Add Student/i });
  addBtn.click();
  expect(screen.getByRole('form', { name: /student-form/i })).toBeInTheDocument();
});
