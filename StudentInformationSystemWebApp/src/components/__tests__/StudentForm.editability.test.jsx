import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StudentForm from "../StudentForm";

describe("StudentForm - input editability and focus behavior", () => {
  it("inputs are not readOnly/disabled, focusable, and accept typing", () => {
    const onSubmit = jest.fn();
    render(<StudentForm onSubmit={onSubmit} submitting={false} />);

    const firstName = screen.getByLabelText(/first name/i);
    const lastName = screen.getByLabelText(/last name/i);
    const email = screen.getByLabelText(/email/i);
    const enrollmentDate = screen.getByLabelText(/enrollment date/i);
    const status = screen.getByLabelText(/status/i);
    const age = screen.getByLabelText(/age/i);

    // Ensure not disabled or readOnly
    [firstName, lastName, email, enrollmentDate, status, age].forEach((el) => {
      expect(el).not.toHaveAttribute("readonly");
      expect(el).not.toBeDisabled();
    });

    // Focus handling
    firstName.focus();
    expect(firstName).toHaveFocus();

    // Typing
    fireEvent.change(firstName, { target: { name: "firstName", value: "Eve" } });
    fireEvent.change(lastName, { target: { name: "lastName", value: "Adams" } });
    fireEvent.change(email, { target: { name: "email", value: "eve@school.edu" } });
    fireEvent.change(enrollmentDate, { target: { name: "enrollmentDate", value: "2024-05-20" } });
    fireEvent.change(status, { target: { name: "status", value: "active" } });
    fireEvent.change(age, { target: { name: "age", value: "19" } });

    expect(firstName).toHaveValue("Eve");
    expect(lastName).toHaveValue("Adams");
    expect(email).toHaveValue("eve@school.edu");
    expect(enrollmentDate).toHaveValue("2024-05-20");
    expect(status).toHaveValue("active");
    expect(age).toHaveValue("19");
  });
});
