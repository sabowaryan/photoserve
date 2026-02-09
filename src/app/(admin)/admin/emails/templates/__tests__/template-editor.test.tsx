import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateEditorContent } from "../template-editor-content";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock EmailEditor component
vi.mock("../email-editor", () => ({
  EmailEditor: ({ }: any) => {
    return <div data-testid="email-editor">Email Editor Mock</div>;
  },
}));

// Mock VariableInserter component
vi.mock("../variable-inserter", () => ({
  VariableInserter: ({ onClose }: any) => (
    <div data-testid="variable-inserter">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe("TemplateEditorContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render template editor in create mode", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByText("Create Email Template")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Design a new email template using the drag-and-drop editor"
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId("email-editor")).toBeInTheDocument();
    });

    it("should have empty form fields in create mode", () => {
      render(<TemplateEditorContent mode="create" />);

      const nameInput = screen.getByLabelText(/Template Name/i);
      const slugInput = screen.getByLabelText(/Template Slug/i);
      const subjectInput = screen.getByLabelText(/Subject Line/i);

      expect(nameInput).toHaveValue("");
      expect(slugInput).toHaveValue("");
      expect(subjectInput).toHaveValue("");
    });

    it("should auto-generate slug from name", async () => {
      const user = userEvent.setup();
      render(<TemplateEditorContent mode="create" />);

      const nameInput = screen.getByLabelText(/Template Name/i);
      const slugInput = screen.getByLabelText(/Template Slug/i);

      await user.type(nameInput, "Welcome Email");

      await waitFor(() => {
        expect(slugInput).toHaveValue("welcome-email");
      });
    });

    it("should show required field indicators", () => {
      render(<TemplateEditorContent mode="create" />);

      const requiredLabels = screen.getAllByText("*");
      expect(requiredLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Edit Mode", () => {
    const mockTemplate = {
      id: "test-id",
      name: "Test Template",
      slug: "test-template",
      subject: "Test Subject",
      type: "transactional" as const,
      source: "custom" as const,
      content: { html: "<p>Test</p>", design: {} },
      variables: ["testVar"],
      is_active: true,
      active_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should render template editor in edit mode", () => {
      render(<TemplateEditorContent mode="edit" template={mockTemplate} />);

      expect(screen.getByText("Edit Email Template")).toBeInTheDocument();
      expect(
        screen.getByText("Update your email template design and settings")
      ).toBeInTheDocument();
    });

    it("should populate form fields with template data", () => {
      render(<TemplateEditorContent mode="edit" template={mockTemplate} />);

      const nameInput = screen.getByLabelText(/Template Name/i);
      const slugInput = screen.getByLabelText(/Template Slug/i);
      const subjectInput = screen.getByLabelText(/Subject Line/i);

      expect(nameInput).toHaveValue("Test Template");
      expect(slugInput).toHaveValue("test-template");
      expect(subjectInput).toHaveValue("Test Subject");
    });

    it("should disable slug field in edit mode", () => {
      render(<TemplateEditorContent mode="edit" template={mockTemplate} />);

      const slugInput = screen.getByLabelText(/Template Slug/i);
      expect(slugInput).toBeDisabled();
    });

    it("should display existing variables", () => {
      render(<TemplateEditorContent mode="edit" template={mockTemplate} />);

      expect(screen.getByText("testVar")).toBeInTheDocument();
    });
  });

  describe("Template Settings", () => {
    it("should render all form fields", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject Line/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Type/i)).toBeInTheDocument();
      expect(screen.getByText(/Template Variables/i)).toBeInTheDocument();
    });

    it("should show helper text for subject line", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(
        screen.getByText(/Use .* and .* for variables/i)
      ).toBeInTheDocument();
    });

    it("should show type description", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(
        screen.getByText(/Sent automatically based on user actions/i)
      ).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should render Save Draft and Publish buttons", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByText("Save Draft")).toBeInTheDocument();
      expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    it("should render Add Variable button", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByText("Add Variable")).toBeInTheDocument();
    });

    it("should open variable inserter when Add Variable is clicked", async () => {
      const user = userEvent.setup();
      render(<TemplateEditorContent mode="create" />);

      const addVariableButton = screen.getByText("Add Variable");
      await user.click(addVariableButton);

      await waitFor(() => {
        expect(screen.getByTestId("variable-inserter")).toBeInTheDocument();
      });
    });
  });

  describe("Email Editor", () => {
    it("should render email editor component", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByTestId("email-editor")).toBeInTheDocument();
    });

    it("should show email design section header", () => {
      render(<TemplateEditorContent mode="create" />);

      expect(screen.getByText("Email Design")).toBeInTheDocument();
      expect(
        screen.getByText("Drag and drop components to build your email template")
      ).toBeInTheDocument();
    });
  });
});
