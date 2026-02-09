import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMessage } from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("renders message correctly", () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders with title", () => {
    render(
      <ErrorMessage
        title="Error"
        message="Something went wrong"
      />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has role alert for accessibility", () => {
    render(<ErrorMessage message="Error message" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows dismiss button when dismissible", () => {
    render(
      <ErrorMessage
        message="Error message"
        dismissible
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/dismiss error message/i)).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorMessage
        message="Error message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    await user.click(screen.getByLabelText(/dismiss error message/i));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not show dismiss button when not dismissible", () => {
    render(<ErrorMessage message="Error message" />);
    expect(screen.queryByLabelText(/dismiss error message/i)).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ErrorMessage message="Error" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  // Edge cases for error message dismissal
  it("dismissal works with keyboard (Enter key)", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorMessage
        message="Error message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    const dismissButton = screen.getByLabelText(/dismiss error message/i);
    dismissButton.focus();
    await user.keyboard("{Enter}");
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismissal works with keyboard (Space key)", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorMessage
        message="Error message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    const dismissButton = screen.getByLabelText(/dismiss error message/i);
    dismissButton.focus();
    await user.keyboard(" ");
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders without dismiss button when onDismiss is not provided", () => {
    render(
      <ErrorMessage
        message="Error message"
        dismissible
      />
    );
    expect(screen.queryByLabelText(/dismiss error message/i)).not.toBeInTheDocument();
  });

  it("displays long error messages correctly", () => {
    const longMessage = "This is a very long error message that should still be displayed correctly without breaking the layout or causing any visual issues.";
    render(<ErrorMessage message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("handles multiple error messages with different titles", () => {
    const { rerender } = render(
      <ErrorMessage title="Validation Error" message="Invalid input" />
    );
    expect(screen.getByText("Validation Error")).toBeInTheDocument();

    rerender(
      <ErrorMessage title="Network Error" message="Connection failed" />
    );
    expect(screen.getByText("Network Error")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass("bg-rose-950/30");
    expect(errorDiv).toHaveClass("border-rose-500/30");
  });
});
