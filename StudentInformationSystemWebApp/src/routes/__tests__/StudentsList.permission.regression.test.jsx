import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock env to provide minimal values and reduce console noise during tests
jest.mock("../../config/env", () => ({
  getEnv: () => ({
    SUPABASE_URL: "http://test.local",
    SUPABASE_ANON_KEY: "anon",
    FEATURE_FLAGS: [],
    LOG_LEVEL: "error",
  }),
}));

// Mock useStudents to simulate permission error on load
jest.mock("../../hooks/useStudents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock realtime to no-op
jest.mock("../../hooks/useRealtimeStudents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock feature flags
jest.mock("../../config/featureFlags", () => ({
  getFeatureFlags: () => ({ all: [], has: () => false }),
}));

import StudentsList from "../StudentsList";
const useStudents = require("../../hooks/useStudents").default;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <StudentsList />
    </MemoryRouter>
  );
}

describe("StudentsList - permission error regression", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows friendly error message when listing is denied by RLS", async () => {
    const error = { code: "42501", message: "permission denied for table students" };
    useStudents.mockReturnValue({
      items: [],
      total: 0,
      loading: false,
      error,
      refetch: jest.fn(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
    // Ensure the user sees the mapped friendly message, not raw internal text
    const errText = screen.getByText(/Error:/i).textContent;
    // should include the friendly "You do not have permission..." mapping
    expect(errText).toMatch(/You do not have permission/i);
  });
}
