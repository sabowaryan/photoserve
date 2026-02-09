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
    const { container } = render(
      <SuccessMessage message="Success" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
