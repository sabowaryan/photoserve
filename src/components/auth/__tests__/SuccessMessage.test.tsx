import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuccessMessage } from "../SuccessMessage";

describe("SuccessMessage", () => {
  it("renders message correctly", () => {
    render(<SuccessMessage message="Operation successful" />);
    expect(screen.getByText("Operation successful")).toBeInTheDocument();
  });

  it("renders with title", () => {
    render(
      <SuccessMessage
        title="Success"
        message="Operation completed"
      />
    );
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Operation completed")).toBeInTheDocument();
  });

  it("has role status for accessibility", () => {
    render(<SuccessMessage message="Success message" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows dismiss button when dismissible", () => {
    render(
      <SuccessMessage
        message="Success message"
        dismissible
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/dismiss success message/i)).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <SuccessMessage
        message="Success message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    await user.click(screen.getByLabelText(/dismiss success message/i));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not show dismiss button when not dismissible", () => {
    render(<SuccessMessage message="Success message" />);
    expect(screen.queryByLabelText(/dismiss success message/i)).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SuccessMessage message="Success" className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  // Edge cases for success message dismissal
  it("dismissal works with keyboard (Enter key)", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <SuccessMessage
        message="Success message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    const dismissButton = screen.getByLabelText(/dismiss success message/i);
    dismissButton.focus();
    await user.keyboard("{Enter}");
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismissal works with keyboard (Space key)", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <SuccessMessage
        message="Success message"
        dismissible
        onDismiss={handleDismiss}
      />
    );
    
    const dismissButton = screen.getByLabelText(/dismiss success message/i);
    dismissButton.focus();
    await user.keyboard(" ");
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders without dismiss button when onDismiss is not provided", () => {
    render(
      <SuccessMessage
        message="Success message"
        dismissible
      />
    );
    expect(screen.queryByLabelText(/dismiss success message/i)).not.toBeInTheDocument();
  });

  it("displays long success messages correctly", () => {
    const longMessage = "This is a very long success message that should still be displayed correctly without breaking the layout or causing any visual issues.";
    render(<SuccessMessage message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("handles multiple success messages with different titles", () => {
    const { rerender } = render(
      <SuccessMessage title="Account Created" message="Welcome!" />
    );
    expect(screen.getByText("Account Created")).toBeInTheDocument();

    rerender(
      <SuccessMessage title="Email Sent" message="Check your inbox" />
    );
    expect(screen.getByText("Email Sent")).toBeInTheDocument();
    expect(screen.getByText("Check your inbox")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    render(<SuccessMessage message="Success" />);
    const successDiv = screen.getByRole("status");
    expect(successDiv).toHaveClass("bg-emerald-950/30");
    expect(successDiv).toHaveClass("border-emerald-500/30");
  });
});
