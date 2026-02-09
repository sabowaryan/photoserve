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
});
