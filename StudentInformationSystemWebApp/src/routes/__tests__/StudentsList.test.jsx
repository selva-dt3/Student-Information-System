import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StudentsList from "../StudentsList";

// Mock useStudents to control list data and fetch behavior
jest.mock("../../hooks/useStudents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock realtime hook to no-op
jest.mock("../../hooks/useRealtimeStudents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock feature flags to disable realtime by default
jest.mock("../../config/featureFlags", () => ({
  getFeatureFlags: () => ({
    all: [],
    has: () => false,
  }),
}));

// Mock delete service
jest.mock("../../services/studentService", () => ({
  deleteStudent: jest.fn(),
}));

const useStudents = require("../../hooks/useStudents").default;
const { deleteStudent } = require("../../services/studentService");

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <StudentsList />
    </MemoryRouter>
  );
}

describe("StudentsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders list and supports client-side search", async () => {
    const items = [
      { id: "1", name: "Alice Smith", email: "alice@example.com", age: 20 },
      { id: "2", name: "Bob Jones", email: "bob@example.com", age: 22 },
    ];
    const refetch = jest.fn();
    useStudents.mockReturnValue({
      items,
      total: items.length,
      loading: false,
      error: null,
      refetch,
    });

    renderPage();

    // Initial table rows visible
    expect(screen.getByText(/Students/i)).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();

    // Search for Bob; since filtering is in useStudents, simulate by re-rendering hook with filtered items
    const searchInput = screen.getByRole("searchbox", { name: /search students/i });
    fireEvent.change(searchInput, { target: { value: "bob" } });

    // After change, component re-renders; emulate useStudents returning filtered results on next call
    useStudents.mockReturnValueOnce({
      items: [{ id: "2", name: "Bob Jones", email: "bob@example.com", age: 22 }],
      total: 1,
      loading: false,
      error: null,
      refetch,
    });

    // Trigger a re-render by changing search again
    fireEvent.change(searchInput, { target: { value: "bob " } });

    expect(await screen.findByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows delete confirmation and calls deleteStudent on confirm", async () => {
    const items = [{ id: "1", name: "Alice Smith", email: "alice@example.com", age: 20 }];
    const refetch = jest.fn();
    useStudents.mockReturnValue({
      items,
      total: 1,
      loading: false,
      error: null,
      refetch,
    });
    deleteStudent.mockResolvedValue(true);

    renderPage();

    // Click Delete button
    fireEvent.click(screen.getByRole("button", { name: /delete alice smith/i }));

    // Confirm dialog appears
    expect(screen.getByText(/Confirm delete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(deleteStudent).toHaveBeenCalledWith("1");
    });
    // After delete, refetch should be called
    await waitFor(() => {
      expect(refetch).toHaveBeenCalled();
    });
  });

  it("handles delete errors by alerting user", async () => {
    const items = [{ id: "1", name: "Alice Smith", email: "alice@example.com", age: 20 }];
    const refetch = jest.fn();
    useStudents.mockReturnValue({
      items,
      total: 1,
      loading: false,
      error: null,
      refetch,
    });
    deleteStudent.mockRejectedValue({ code: "42501", message: "permission denied" });

    // Spy on alert
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /delete alice smith/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(deleteStudent).toHaveBeenCalledWith("1");
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });
});
