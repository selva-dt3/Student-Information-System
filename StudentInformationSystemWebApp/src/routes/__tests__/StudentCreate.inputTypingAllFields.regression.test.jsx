import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
import { createStudent } from "../../services/studentService";

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

describe("StudentCreate - all fields typing and submit regression", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows typing in all inputs and keeps values, then submits", async () => {
    renderPage();

    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    const email = screen.getByLabelText(/email/i);
    const enrollmentDate = screen.getByLabelText(/enrollment date/i);
    const status = screen.getByLabelText(/status/i);
    const age = screen.getByLabelText(/age/i);

    // Type into inputs
    fireEvent.change(firstName, { target: { name: "firstName", value: "Alex" } });
    fireEvent.change(lastName, { target: { name: "lastName", value: "Taylor" } });
    fireEvent.change(email, { target: { name: "email", value: "alex.taylor@example.com" } });
    fireEvent.change(enrollmentDate, { target: { name: "enrollmentDate", value: "2024-03-15" } });
    fireEvent.change(status, { target: { name: "status", value: "inactive" } });
    fireEvent.change(age, { target: { name: "age", value: "30" } });

    // Values should reflect
    expect(firstName).toHaveValue("Alex");
    expect(lastName).toHaveValue("Taylor");
    expect(email).toHaveValue("alex.taylor@example.com");
    expect(enrollmentDate).toHaveValue("2024-03-15");
    expect(status).toHaveValue("inactive");
    expect(age).toHaveValue("30");

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(createStudent).toHaveBeenCalledTimes(1);
    });

    // Navigated back to Home after submit
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});
