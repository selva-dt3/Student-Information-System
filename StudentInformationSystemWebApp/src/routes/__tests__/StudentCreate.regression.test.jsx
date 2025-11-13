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

describe("StudentCreate form editability regression", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows typing into all fields and submits successfully", async () => {
    renderPage();

    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    const email = screen.getByLabelText(/email/i);
    const enrollmentDate = screen.getByLabelText(/enrollment date/i);
    const status = screen.getByLabelText(/status/i);
    const age = screen.getByLabelText(/age/i);

    // Type into inputs
    fireEvent.change(firstName, { target: { name: "firstName", value: "Jane" } });
    fireEvent.change(lastName, { target: { name: "lastName", value: "Smith" } });
    fireEvent.change(email, { target: { name: "email", value: "jane@example.com" } });
    fireEvent.change(enrollmentDate, { target: { name: "enrollmentDate", value: "2024-02-01" } });
    fireEvent.change(status, { target: { name: "status", value: "active" } });
    fireEvent.change(age, { target: { name: "age", value: "23" } });

    // Verify values are reflected (controlled inputs)
    expect(firstName).toHaveValue("Jane");
    expect(lastName).toHaveValue("Smith");
    expect(email).toHaveValue("jane@example.com");
    expect(enrollmentDate).toHaveValue("2024-02-01");
    expect(status).toHaveValue("active");
    expect(age).toHaveValue("23");

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(createStudent).toHaveBeenCalledTimes(1);
    });

    // Ensure we navigated back to Home
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});
