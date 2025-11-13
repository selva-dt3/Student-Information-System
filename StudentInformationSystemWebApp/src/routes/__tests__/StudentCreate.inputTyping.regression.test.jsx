import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock env to avoid Supabase config errors in tests
jest.mock("../../config/env", () => ({
  getEnv: () => ({
    SUPABASE_URL: "http://test.local",
    SUPABASE_ANON_KEY: "anon",
    FEATURE_FLAGS: [],
    LOG_LEVEL: "error",
  }),
}));

// Mock student service createStudent to avoid network usage
jest.mock("../../services/studentService", () => ({
  createStudent: jest.fn().mockResolvedValue({ id: "1" }),
}));

import StudentCreate from "../StudentCreate";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/students/new"]}>
      <Routes>
        <Route path="/students/new" element={<StudentCreate />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("StudentCreate - input typing editability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows typing into First Name, Last Name, and Email fields", () => {
    renderPage();

    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    const email = screen.getByLabelText(/email/i);

    fireEvent.change(firstName, { target: { name: "firstName", value: "Alice" } });
    fireEvent.change(lastName, { target: { name: "lastName", value: "Johnson" } });
    fireEvent.change(email, { target: { name: "email", value: "alice@example.com" } });

    expect(firstName).toHaveValue("Alice");
    expect(lastName).toHaveValue("Johnson");
    expect(email).toHaveValue("alice@example.com");
  });
});
