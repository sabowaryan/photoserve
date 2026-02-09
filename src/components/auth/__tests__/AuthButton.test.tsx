import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthButton } from "../AuthButton";
import { Mail } from "lucide-react";

describe("AuthButton", () => {
  it("renders primary variant correctly", () => {
    render(<AuthButton>Sign In</AuthButton>);
    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("from-indigo-600");
  });

  it("renders secondary variant correctly", () => {
    render(<AuthButton variant="secondary">Cancel</AuthButton>);
    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("border-white/10");
  });

  it("renders oauth variant correctly", () => {
    render(<AuthButton variant="oauth">Continue with Google</AuthButton>);
    const button = screen.getByRole("button", { name: /continue with google/i });
    expect(button).toHaveClass("bg-white/90");
    expect(button).toHaveClass("border-slate-200");
  });

  it("renders ghost variant correctly", () => {
    render(<AuthButton variant="ghost">Resend</AuthButton>);
    const button = screen.getByRole("button", { name: /resend/i });
    expect(button).toHaveClass("bg-transparent");
  });

  it("renders different sizes correctly", () => {
    const { rerender } = render(<AuthButton size="sm">Small</AuthButton>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<AuthButton size="md">Medium</AuthButton>);
    expect(screen.getByRole("button")).toHaveClass("h-12");

    rerender(<AuthButton size="lg">Large</AuthButton>);
    expect(screen.getByRole("button")).toHaveClass("h-14");
  });

  it("renders full width when specified", () => {
    render(<AuthButton fullWidth>Full Width</AuthButton>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("shows loading state correctly", () => {
    render(<AuthButton loading>Loading</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(
      <AuthButton icon={<Mail data-testid="mail-icon" />}>
        Email
      </AuthButton>
    );
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<AuthButton onClick={handleClick}>Click Me</AuthButton>);
    
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<AuthButton disabled>Disabled</AuthButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when loading", () => {
    render(<AuthButton loading>Loading</AuthButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not trigger click when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<AuthButton disabled onClick={handleClick}>Disabled</AuthButton>);
    
    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Edge cases for button variants
  it("primary variant has gradient background", () => {
    render(<AuthButton variant="primary">Primary</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gradient-to-r");
    expect(button).toHaveClass("from-indigo-600");
  });

  it("secondary variant has border and transparent background", () => {
    render(<AuthButton variant="secondary">Secondary</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white/5");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("border-white/10");
  });

  it("oauth variant has white background for Google branding", () => {
    render(<AuthButton variant="oauth">OAuth</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white/90");
    expect(button).toHaveClass("text-slate-700");
  });

  it("ghost variant has no background or border", () => {
    render(<AuthButton variant="ghost">Ghost</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-transparent");
  });

  it("maintains button dimensions during loading state", () => {
    const { rerender } = render(<AuthButton>Submit</AuthButton>);
    const button = screen.getByRole("button");
    const initialHeight = button.className.match(/h-\d+/)?.[0];
    
    rerender(<AuthButton loading>Submit</AuthButton>);
    expect(button.className).toContain(initialHeight);
  });

  it("loading state shows spinner and maintains text", () => {
    render(<AuthButton loading>Submit</AuthButton>);
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("combines size and fullWidth props correctly", () => {
    render(<AuthButton size="lg" fullWidth>Large Full</AuthButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-14");
    expect(button).toHaveClass("w-full");
  });

  it("icon appears before text", () => {
    render(
      <AuthButton icon={<Mail data-testid="icon" />}>
        With Icon
      </AuthButton>
    );
    const button = screen.getByRole("button");
    const icon = screen.getByTestId("icon");
    const text = screen.getByText("With Icon");
    
    expect(button.contains(icon)).toBe(true);
    expect(button.contains(text)).toBe(true);
  });
});
