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
      expect(element).toHaveClass("text-emerald-700");
    });
  });

  it("marks unmet requirements correctly", () => {
    render(<PasswordStrengthIndicator password="abc" />);
    
    const element = screen.getByText("At least 8 characters");
    expect(element).toHaveClass("text-slate-600");
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
});
