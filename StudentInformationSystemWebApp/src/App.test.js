import { render, screen } from '@testing-library/react';
// Mock env to silence missing env logs and prevent Supabase config errors in tests
jest.mock('./config/env', () => ({
  getEnv: () => ({
    SUPABASE_URL: 'http://test.local',
    SUPABASE_ANON_KEY: 'anon',
    FEATURE_FLAGS: [],
    LOG_LEVEL: 'error',
  }),
}));

import App from './App';

test('renders navbar brand', () => {
  render(<App />);
  const brand = screen.getByText(/SIS/i);
  expect(brand).toBeInTheDocument();
});
