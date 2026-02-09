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
    expect(input).toHaveClass("border-rose-500/50");
    expect(input).toHaveClass("bg-rose-950/20");
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
    expect(input).toHaveClass("border-emerald-500/50");
    expect(input).toHaveClass("bg-emerald-950/20");
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

  // Edge cases for input states
  it("default state has correct styling", () => {
    render(<FormInput id="email" label="Email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveClass("bg-slate-900/50");
    expect(input).toHaveClass("border-white/10");
  });

  it("focus state applies correct border color", () => {
    render(<FormInput id="email" label="Email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveClass("focus:border-indigo-500");
  });

  it("error state overrides success state", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        error="Error message"
        success
      />
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveClass("border-rose-500/50");
    expect(input).not.toHaveClass("border-emerald-500/50");
  });

  it("disabled state prevents interaction", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormInput
        id="email"
        label="Email"
        disabled
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText(/email/i);
    await user.type(input, "test");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("password toggle button has correct aria-label", () => {
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        showPasswordToggle
      />
    );
    expect(screen.getByLabelText("Show password")).toBeInTheDocument();
  });

  it("password toggle updates aria-label when toggled", async () => {
    const user = userEvent.setup();
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        showPasswordToggle
      />
    );
    
    const toggleButton = screen.getByLabelText("Show password");
    await user.click(toggleButton);
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument();
  });

  it("icon color changes based on state", () => {
    const { rerender, container } = render(
      <FormInput
        id="email"
        label="Email"
        icon={<Mail data-testid="icon" />}
      />
    );
    let iconContainer = container.querySelector(".absolute.left-4");
    expect(iconContainer).toHaveClass("text-slate-500");

    rerender(
      <FormInput
        id="email"
        label="Email"
        icon={<Mail data-testid="icon" />}
        error="Error"
      />
    );
    iconContainer = container.querySelector(".absolute.left-4");
    expect(iconContainer).toHaveClass("text-rose-400");

    rerender(
      <FormInput
        id="email"
        label="Email"
        icon={<Mail data-testid="icon" />}
        success
      />
    );
    iconContainer = container.querySelector(".absolute.left-4");
    expect(iconContainer).toHaveClass("text-emerald-400");
  });

  it("error message has role alert", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        error="Invalid email"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });

  it("combines multiple props correctly", () => {
    render(
      <FormInput
        id="email"
        label="Email"
        required
        helperText="Helper"
        icon={<Mail data-testid="icon" />}
      />
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("Helper")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
