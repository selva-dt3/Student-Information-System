import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home header and navigation to search', () => {
  render(<App />);
  expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Search Students/i })).toBeInTheDocument();
});
