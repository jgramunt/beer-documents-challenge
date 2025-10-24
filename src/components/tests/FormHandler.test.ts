import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FormHandler, FormData } from "../FormHandler.js";
import { validateDocumentName } from "../../utils/formValidation.js";

// Mock form validation utilities
vi.mock("../../utils/formValidation.js", () => ({
  validateDocumentName: vi.fn((name: string) => {
    if (!name) return { valid: false, error: "Name is required" };
    if (name.length < 3)
      return { valid: false, error: "Name must be at least 3 characters" };
    return { valid: true };
  }),
  validateVersion: vi.fn((version: string) => {
    if (!version) return { valid: false, error: "Version is required" };
    if (!/^\d+\.\d+\.\d+$/.test(version))
      return { valid: false, error: "Version must be in format x.y.z" };
    return { valid: true };
  }),
  handleValidation: vi.fn(),
}));

describe("FormHandler", () => {
  let formHandler: FormHandler;
  let modal: HTMLElement;
  let form: HTMLFormElement;
  let closeBtn: HTMLElement;
  let createCardBtn: HTMLElement;
  let nameInput: HTMLInputElement;
  let versionInput: HTMLInputElement;
  let contributorsInput: HTMLTextAreaElement;
  let attachmentsInput: HTMLTextAreaElement;
  let submitBtn: HTMLButtonElement;

  const createMockElements = () => {
    // Create modal
    modal = document.createElement("div");
    modal.id = "new-document-modal";
    modal.classList.add("hidden");

    // Create form
    form = document.createElement("form");
    form.id = "new-document-form";

    // Create close button
    closeBtn = document.createElement("button");
    closeBtn.id = "modal-close";

    // Create create card button
    createCardBtn = document.createElement("button");
    createCardBtn.id = "create-card-button";

    // Create name input
    nameInput = document.createElement("input");
    nameInput.id = "doc-name";
    nameInput.type = "text";

    // Create version input
    versionInput = document.createElement("input");
    versionInput.id = "doc-version";
    versionInput.type = "text";

    // Create contributors input
    contributorsInput = document.createElement("textarea");
    contributorsInput.id = "doc-contributors";

    // Create attachments input
    attachmentsInput = document.createElement("textarea");
    attachmentsInput.id = "doc-attachments";

    // Create submit button
    submitBtn = document.createElement("button");
    submitBtn.type = "submit";

    // Append elements to form and modal
    form.appendChild(nameInput);
    form.appendChild(versionInput);
    form.appendChild(contributorsInput);
    form.appendChild(attachmentsInput);
    form.appendChild(submitBtn);

    modal.appendChild(form);
    modal.appendChild(closeBtn);

    // Add elements to DOM
    document.body.appendChild(modal);
    document.body.appendChild(createCardBtn);
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    createMockElements();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with required DOM elements", () => {
      expect(() => new FormHandler()).not.toThrow();

      const instance = new FormHandler();
      expect(instance).toBeInstanceOf(FormHandler);
    });

    it("should throw error when modal is missing", () => {
      document.getElementById("new-document-modal")?.remove();

      expect(() => new FormHandler()).toThrow(
        "Modal element with id 'new-document-modal' not found"
      );
    });

    it("should throw error when form is missing", () => {
      form.remove();

      expect(() => new FormHandler()).toThrow(
        "Form element with id 'document-form' not found"
      );
    });

    it("should throw error when close button is missing", () => {
      closeBtn.remove();

      expect(() => new FormHandler()).toThrow(
        "Close button with id 'modal-close' not found"
      );
    });

    it("should throw error when create card button is missing", () => {
      createCardBtn.remove();

      expect(() => new FormHandler()).toThrow(
        "Create card button with id 'create-card-button' not found"
      );
    });

    it("should throw error when name input is missing", () => {
      nameInput.remove();

      expect(() => new FormHandler()).toThrow(
        "Name input element with id 'doc-name' not found"
      );
    });

    it("should throw error when version input is missing", () => {
      versionInput.remove();

      expect(() => new FormHandler()).toThrow(
        "Version input element with id 'doc-version' not found"
      );
    });

    it("should throw error when submit button is missing", () => {
      submitBtn.remove();

      expect(() => new FormHandler()).toThrow(
        "Submit button not found in form"
      );
    });

    it("should setup event listeners on initialization", () => {
      const createCardSpy = vi.spyOn(createCardBtn, "addEventListener");
      const closeSpy = vi.spyOn(closeBtn, "addEventListener");
      const formSpy = vi.spyOn(form, "addEventListener");
      const modalSpy = vi.spyOn(modal, "addEventListener");
      const nameSpy = vi.spyOn(nameInput, "addEventListener");
      const versionSpy = vi.spyOn(versionInput, "addEventListener");

      new FormHandler();

      expect(createCardSpy).toHaveBeenCalledWith("click", expect.any(Function));
      expect(closeSpy).toHaveBeenCalledWith("click", expect.any(Function));
      expect(formSpy).toHaveBeenCalledWith("submit", expect.any(Function));
      expect(modalSpy).toHaveBeenCalledWith("click", expect.any(Function));
      expect(nameSpy).toHaveBeenCalledWith("blur", expect.any(Function));
      expect(versionSpy).toHaveBeenCalledWith("blur", expect.any(Function));
    });
  });

  describe("Modal Management", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should open modal when create card button is clicked", () => {
      expect(modal.classList.contains("hidden")).toBe(true);
      expect(document.body.classList.contains("modal-open")).toBe(false);

      createCardBtn.click();

      expect(modal.classList.contains("hidden")).toBe(false);
      expect(document.body.classList.contains("modal-open")).toBe(true);
    });

    it("should close modal when close button is clicked", () => {
      createCardBtn.click(); // Open modal first
      expect(modal.classList.contains("hidden")).toBe(false);

      closeBtn.click();

      expect(modal.classList.contains("hidden")).toBe(true);
      expect(document.body.classList.contains("modal-open")).toBe(false);
    });

    it("should reset form when closing modal", () => {
      const resetSpy = vi.spyOn(form, "reset");

      createCardBtn.click();
      closeBtn.click();

      expect(resetSpy).toHaveBeenCalled();
    });

    it("should close modal when clicking on backdrop", () => {
      createCardBtn.click();
      expect(modal.classList.contains("hidden")).toBe(false);

      // Simulate clicking on modal backdrop (modal itself)
      const event = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(event, "target", { value: modal });
      modal.dispatchEvent(event);

      expect(modal.classList.contains("hidden")).toBe(true);
    });

    it("should not close modal when clicking inside modal content", () => {
      createCardBtn.click();
      expect(modal.classList.contains("hidden")).toBe(false);

      // Simulate clicking on form (not the backdrop)
      const event = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(event, "target", { value: form });
      modal.dispatchEvent(event);

      expect(modal.classList.contains("hidden")).toBe(false);
    });
  });

  describe("Field Validation", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should validate name field on blur with valid input", () => {
      nameInput.value = "Valid Document Name";

      nameInput.dispatchEvent(new FocusEvent("blur"));

      expect(nameInput.classList.contains("error")).toBe(false);
      expect(document.getElementById("doc-name-error")).toBeNull();
    });

    it("should validate name field on blur with invalid input", () => {
      nameInput.value = "";

      nameInput.dispatchEvent(new FocusEvent("blur"));

      expect(nameInput.classList.contains("error")).toBe(true);
      const errorElement = document.getElementById("doc-name-error");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toBe("Name is required");
    });

    it("should validate version field on blur with valid input", () => {
      versionInput.value = "1.0.0";

      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(versionInput.classList.contains("error")).toBe(false);
      expect(document.getElementById("doc-version-error")).toBeNull();
    });

    it("should validate version field on blur with invalid input", () => {
      versionInput.value = "invalid-version";

      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(versionInput.classList.contains("error")).toBe(true);
      const errorElement = document.getElementById("doc-version-error");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toBe("Version must be in format x.y.z");
    });

    it("should remove error styling when field becomes valid", () => {
      // First make field invalid
      nameInput.value = "";
      nameInput.dispatchEvent(new FocusEvent("blur"));
      expect(nameInput.classList.contains("error")).toBe(true);

      // Then make it valid
      nameInput.value = "Valid Name";
      nameInput.dispatchEvent(new FocusEvent("blur"));

      expect(nameInput.classList.contains("error")).toBe(false);
      expect(document.getElementById("doc-name-error")).toBeNull();
    });

    it("should update error message for same field", () => {
      // First error
      nameInput.value = "";
      nameInput.dispatchEvent(new FocusEvent("blur"));
      let errorElement = document.getElementById("doc-name-error");
      expect(errorElement?.textContent).toBe("Name is required");

      // Second error (different validation failure)
      nameInput.value = "ab"; // Too short
      nameInput.dispatchEvent(new FocusEvent("blur"));
      errorElement = document.getElementById("doc-name-error");
      expect(errorElement?.textContent).toBe(
        "Name must be at least 3 characters"
      );
    });
  });

  describe("Submit Button State", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should disable submit button when name is invalid", () => {
      nameInput.value = "";
      versionInput.value = "1.0.0";

      nameInput.dispatchEvent(new FocusEvent("blur"));

      expect(submitBtn.disabled).toBe(true);
    });

    it("should disable submit button when version is invalid", () => {
      nameInput.value = "Valid Name";
      versionInput.value = "invalid";

      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(submitBtn.disabled).toBe(true);
    });

    it("should enable submit button when both fields are valid", () => {
      nameInput.value = "Valid Name";
      versionInput.value = "1.0.0";

      nameInput.dispatchEvent(new FocusEvent("blur"));
      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(submitBtn.disabled).toBe(false);
    });

    it("should disable submit button when both fields are invalid", () => {
      nameInput.value = "";
      versionInput.value = "invalid";

      nameInput.dispatchEvent(new FocusEvent("blur"));
      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(submitBtn.disabled).toBe(true);
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should prevent default form submission", () => {
      const event = new Event("submit", { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      form.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should collect form data correctly", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      contributorsInput.value = "John Doe, Jane Smith";
      attachmentsInput.value = "file1.pdf, file2.doc";

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: "Test Document",
        version: "1.0.0",
        contributors: ["John Doe", "Jane Smith"],
        attachments: ["file1.pdf", "file2.doc"],
      });
    });

    it("should handle empty contributors and attachments", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      contributorsInput.value = "";
      attachmentsInput.value = "";

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: "Test Document",
        version: "1.0.0",
        contributors: [],
        attachments: [],
      });
    });

    it("should trim and filter contributors", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      contributorsInput.value = " John Doe , , Jane Smith , ";
      attachmentsInput.value = "";

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: "Test Document",
        version: "1.0.0",
        contributors: ["John Doe", "Jane Smith"],
        attachments: [],
      });
    });

    it("should trim and filter attachments", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      contributorsInput.value = "";
      attachmentsInput.value = " file1.pdf , , file2.doc , ";

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: "Test Document",
        version: "1.0.0",
        contributors: [],
        attachments: ["file1.pdf", "file2.doc"],
      });
    });

    it("should close modal after submission", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      createCardBtn.click(); // Open modal
      expect(modal.classList.contains("hidden")).toBe(false);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";

      form.dispatchEvent(new Event("submit"));

      expect(modal.classList.contains("hidden")).toBe(true);
    });

    it("should not call callback if none is set", () => {
      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";

      expect(() => form.dispatchEvent(new Event("submit"))).not.toThrow();
    });
  });

  describe("Callback Management", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should set submit callback", () => {
      const callback = vi.fn();

      formHandler.onSubmit(callback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      form.dispatchEvent(new Event("submit"));

      expect(callback).toHaveBeenCalled();
    });

    it("should replace previous callback", () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      formHandler.onSubmit(firstCallback);
      formHandler.onSubmit(secondCallback);

      nameInput.value = "Test Document";
      versionInput.value = "1.0.0";
      form.dispatchEvent(new Event("submit"));

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      formHandler = new FormHandler();
    });

    it("should handle special characters in form data", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      nameInput.value = 'Test & "Special" <Document>';
      versionInput.value = "1.0.0";
      contributorsInput.value = 'John "Doe", Jane <Smith>';
      attachmentsInput.value = 'file&1.pdf, "file2".doc';

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: 'Test & "Special" <Document>',
        version: "1.0.0",
        contributors: ['John "Doe"', "Jane <Smith>"],
        attachments: ["file&1.pdf", '"file2".doc'],
      });
    });

    it("should handle very long input values", () => {
      const submitCallback = vi.fn();
      formHandler.onSubmit(submitCallback);

      const longName = "A".repeat(1000);
      const longContributor = "B".repeat(500);

      nameInput.value = longName;
      versionInput.value = "1.0.0";
      contributorsInput.value = longContributor;

      form.dispatchEvent(new Event("submit"));

      expect(submitCallback).toHaveBeenCalledWith({
        name: longName,
        version: "1.0.0",
        contributors: [longContributor],
        attachments: [],
      });
    });

    it("should handle rapid modal open/close", () => {
      for (let i = 0; i < 10; i++) {
        createCardBtn.click();
        closeBtn.click();
      }

      expect(modal.classList.contains("hidden")).toBe(true);
      expect(document.body.classList.contains("modal-open")).toBe(false);
    });

    it("should handle multiple validation errors simultaneously", () => {
      nameInput.value = "";
      versionInput.value = "invalid";

      nameInput.dispatchEvent(new FocusEvent("blur"));
      versionInput.dispatchEvent(new FocusEvent("blur"));

      expect(nameInput.classList.contains("error")).toBe(true);
      expect(versionInput.classList.contains("error")).toBe(true);
      expect(document.getElementById("doc-name-error")).toBeTruthy();
      expect(document.getElementById("doc-version-error")).toBeTruthy();
      expect(submitBtn.disabled).toBe(true);
    });

    it("should handle null error in validation result", () => {
      const mockValidation = vi.mocked(validateDocumentName);
      mockValidation.mockReturnValueOnce({ valid: false, error: null as any });

      nameInput.value = "test";
      nameInput.dispatchEvent(new FocusEvent("blur"));

      const errorElement = document.getElementById("doc-name-error");
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toBe("");
    });
  });
});
