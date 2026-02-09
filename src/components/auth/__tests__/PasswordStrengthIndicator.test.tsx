import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "../PasswordStrengthIndicator";

describe("PasswordStrengthIndicator", () => {
  it("does not render when password is empty", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("calculates weak password strength correctly", () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("calculates fair password strength correctly", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("calculates good password strength correctly", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh1" />);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("calculates strong password strength correctly", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("shows all password requirements", () => {
    render(<PasswordStrengthIndicator password="test" />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Contains uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("Contains lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("Contains number")).toBeInTheDocument();
    expect(screen.getByText("Contains special character")).toBeInTheDocument();
  });

  it("marks met requirements correctly", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh1!" />);
    
    // All requirements should be met
    const requirements = [
      "At least 8 characters",
      "Contains uppercase letter",
      "Contains lowercase letter",
      "Contains number",
      "Contains special character",
    ];
    
    requirements.forEach((req) => {
      const element = screen.getByText(req);
      expect(element).toHaveClass("text-emerald-400");
    });
  });

  it("marks unmet requirements correctly", () => {
    render(<PasswordStrengthIndicator password="abc" />);
    
    const element = screen.getByText("At least 8 characters");
    expect(element).toHaveClass("text-slate-400");
  });

  it("calls onStrengthChange with correct strength", () => {
    const handleStrengthChange = vi.fn();
    render(
      <PasswordStrengthIndicator
        password="Abcdefgh1!"
        onStrengthChange={handleStrengthChange}
      />
    );
    
    expect(handleStrengthChange).toHaveBeenCalledWith(5);
  });

  it("updates strength when password changes", () => {
    const handleStrengthChange = vi.fn();
    const { rerender } = render(
      <PasswordStrengthIndicator
        password="abc"
        onStrengthChange={handleStrengthChange}
      />
    );
    
    expect(handleStrengthChange).toHaveBeenCalledWith(1);
    
    rerender(
      <PasswordStrengthIndicator
        password="Abcdefgh1!"
        onStrengthChange={handleStrengthChange}
      />
    );
    
    expect(handleStrengthChange).toHaveBeenCalledWith(5);
  });

  it("displays strength bar with correct segments", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText("Password strength")).toBeInTheDocument();
  });

  // Edge cases for various password combinations
  it("handles empty password", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("handles very short password", () => {
    render(<PasswordStrengthIndicator password="a" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("handles password with only lowercase", () => {
    render(<PasswordStrengthIndicator password="abcdefgh" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(screen.getByText("Contains uppercase letter")).toHaveClass("text-slate-400");
  });

  it("handles password with only uppercase", () => {
    render(<PasswordStrengthIndicator password="ABCDEFGH" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(screen.getByText("Contains lowercase letter")).toHaveClass("text-slate-400");
  });

  it("handles password with only numbers", () => {
    render(<PasswordStrengthIndicator password="12345678" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(screen.getByText("Contains uppercase letter")).toHaveClass("text-slate-400");
    expect(screen.getByText("Contains lowercase letter")).toHaveClass("text-slate-400");
  });

  it("handles password with only special characters", () => {
    render(<PasswordStrengthIndicator password="!@#$%^&*" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("handles password with mixed case but no numbers or special chars", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
    expect(screen.getByText("Contains number")).toHaveClass("text-slate-400");
    expect(screen.getByText("Contains special character")).toHaveClass("text-slate-400");
  });

  it("handles password with all requirements except special char", () => {
    render(<PasswordStrengthIndicator password="Abcdefgh1" />);
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Contains special character")).toHaveClass("text-slate-400");
  });

  it("handles very strong password", () => {
    render(<PasswordStrengthIndicator password="MyP@ssw0rd123!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    
    const requirements = [
      "At least 8 characters",
      "Contains uppercase letter",
      "Contains lowercase letter",
      "Contains number",
      "Contains special character",
    ];
    
    requirements.forEach((req) => {
      expect(screen.getByText(req)).toHaveClass("text-emerald-400");
    });
  });

  it("handles password with multiple special characters", () => {
    render(<PasswordStrengthIndicator password="P@ssw0rd!#$" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("handles password with spaces", () => {
    render(<PasswordStrengthIndicator password="My P@ssw0rd" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("updates strength dynamically as password changes", () => {
    const { rerender } = render(<PasswordStrengthIndicator password="a" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Ab" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Abcdefgh1" />);
    expect(screen.getByText("Good")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Abcdefgh1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("calls onStrengthChange for each strength level", () => {
    const handleStrengthChange = vi.fn();
    const { rerender } = render(
      <PasswordStrengthIndicator password="a" onStrengthChange={handleStrengthChange} />
    );
    expect(handleStrengthChange).toHaveBeenCalledWith(1);

    rerender(<PasswordStrengthIndicator password="Abcdefgh" onStrengthChange={handleStrengthChange} />);
    expect(handleStrengthChange).toHaveBeenCalledWith(3);

    rerender(<PasswordStrengthIndicator password="Abcdefgh1!" onStrengthChange={handleStrengthChange} />);
    expect(handleStrengthChange).toHaveBeenCalledWith(5);
  });

  it("applies custom className", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
