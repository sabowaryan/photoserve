import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders correctly", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<LoadingSpinner text="Please wait" />);
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it("renders different sizes correctly", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-live attribute for accessibility", () => {
    render(<LoadingSpinner />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("applies custom className", () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  it("includes screen reader text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading")).toHaveClass("sr-only");
  });
});
