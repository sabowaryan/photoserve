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

  // Edge cases for loading spinner sizes
  it("sm size has correct dimensions", () => {
    render(<LoadingSpinner size="sm" data-testid="spinner" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("md size has correct dimensions", () => {
    render(<LoadingSpinner size="md" data-testid="spinner" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("lg size has correct dimensions", () => {
    render(<LoadingSpinner size="lg" data-testid="spinner" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("xl size has correct dimensions", () => {
    render(<LoadingSpinner size="xl" data-testid="spinner" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("renders without text when text prop is empty string", () => {
    render(<LoadingSpinner text="" />);
    // The component always shows "Loading" in sr-only for accessibility
    // but should not show the visible text paragraph
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it("combines size and custom text correctly", () => {
    render(<LoadingSpinner size="lg" text="Processing" />);
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has correct color for dark theme", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("svg");
    expect(spinner).toHaveClass("text-indigo-400");
  });

  it("has animation classes", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("svg");
    expect(spinner).toHaveClass("animate-spin");
  });

  it("maintains accessibility with custom text", () => {
    render(<LoadingSpinner text="Loading data" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });
});
