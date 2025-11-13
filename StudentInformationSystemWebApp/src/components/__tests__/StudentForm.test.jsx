import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StudentForm from "../StudentForm";

describe("StudentForm", () => {
  const validInitial = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    enrollmentDate: "2024-01-01",
    status: "active",
    age: "21",
  };

  it("shows validation errors on blur and blocks submit when invalid", () => {
    const onSubmit = jest.fn();
    render(<StudentForm onSubmit={onSubmit} submitting={false} />);

    const firstName = screen.getByLabelText(/first name/i);
    fireEvent.blur(firstName); // blur with empty value

    expect(screen.getByText(/First name is required/i)).toBeInTheDocument();

    // Try submit with empty fields
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    // Should not submit
    expect(onSubmit).not.toHaveBeenCalled();
    // Multiple errors should be visible
    expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Enrollment date is required/i)).toBeInTheDocument();
  });

  it("accepts valid values and calls onSubmit with normalized payload", () => {
    const onSubmit = jest.fn();
    render(<StudentForm initialValues={validInitial} onSubmit={onSubmit} submitting={false} />);

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    const arg = onSubmit.mock.calls[0][0];
    expect(arg).toMatchObject({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      enrollmentDate: "2024-01-01",
      status: "active",
      age: 21, // normalized to number
    });
  });

  it("treats empty age as null", () => {
    const onSubmit = jest.fn();
    render(
      <StudentForm
        initialValues={{ ...validInitial, age: "" }}
        onSubmit={onSubmit}
        submitting={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.age).toBeNull();
  });

  it("rejects invalid email and age", () => {
    const onSubmit = jest.fn();
    render(<StudentForm onSubmit={onSubmit} submitting={false} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "bad-email" } });
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: "-5" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    expect(screen.getByText(/Age must be positive/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
