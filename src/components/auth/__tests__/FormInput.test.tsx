import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormInput } from "../FormInput";
import { Mail } from "lucide-react";

describe("FormInput", () => {
  it("renders with label", () => {
    render(<FormInput id="email" label="Email Address" />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("shows required indicator when required", () => {
    render(<FormInput id="email" label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays helper text", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        helperText="We'll never share your email"
      />
    );
    expect(screen.getByText(/we'll never share your email/i)).toBeInTheDocument();
  });

  it("displays error message correctly", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        error="Invalid email address"
      />
    );
    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent("Invalid email address");
  });

  it("applies error styling when error is present", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        error="Invalid email"
      />
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveClass("border-rose-500");
    expect(input).toHaveClass("bg-rose-50");
  });

  it("shows success state correctly", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        success
      />
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveClass("border-emerald-500");
    expect(input).toHaveClass("bg-emerald-50");
  });

  it("renders with icon", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        icon={<Mail data-testid="mail-icon" />}
      />
    );
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("shows password toggle button when showPasswordToggle is true", () => {
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        showPasswordToggle
      />
    );
    expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        showPasswordToggle
      />
    );
    
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/show password/i);
    
    expect(input).toHaveAttribute("type", "password");
    
    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
    
    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });

  it("handles input changes", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormInput
        id="email"
        label="Email"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText(/email/i);
    await user.type(input, "test@example.com");
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        disabled
      />
    );
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it("sets aria-invalid when error is present", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        error="Invalid email"
      />
    );
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("links input to helper text with aria-describedby", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        helperText="Helper text"
      />
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("aria-describedby");
  });
});
