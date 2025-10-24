export interface FormData {
  name: string;
  version: string;
  contributors: string[];
  attachments: string[];
}

import {
  validateDocumentName,
  validateVersion,
  handleValidation,
} from "../utils/formValidation.js";

export class FormHandler {
  private modal: HTMLElement;
  private form: HTMLFormElement;
  private closeBtn: HTMLElement;
  private createCardBtn: HTMLElement;
  private nameInput: HTMLInputElement;
  private versionInput: HTMLInputElement;
  private submitBtn: HTMLButtonElement;
  private submitCallback: ((data: FormData) => void) | null = null;

  constructor() {
    this.modal = document.getElementById("new-document-modal") as HTMLElement;

    if (!this.modal) {
      throw new Error("Modal element with id 'new-document-modal' not found");
    }

    this.form = this.modal.querySelector(
      "#new-document-form"
    ) as HTMLFormElement;
    this.closeBtn = this.modal.querySelector("#modal-close") as HTMLElement;
    this.createCardBtn = document.getElementById(
      "create-card-button"
    ) as HTMLElement;
    this.nameInput = document.getElementById("doc-name") as HTMLInputElement;
    this.versionInput = document.getElementById(
      "doc-version"
    ) as HTMLInputElement;
    this.submitBtn = this.modal.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;

    this.validateElements();
    this.initEventListeners();
  }

  private validateElements(): void {
    if (!this.form) {
      throw new Error("Form element with id 'document-form' not found");
    }
    if (!this.closeBtn) {
      throw new Error("Close button with id 'modal-close' not found");
    }
    if (!this.createCardBtn) {
      throw new Error(
        "Create card button with id 'create-card-button' not found"
      );
    }
    if (!this.nameInput) {
      throw new Error("Name input element with id 'doc-name' not found");
    }
    if (!this.versionInput) {
      throw new Error("Version input element with id 'doc-version' not found");
    }
    if (!this.submitBtn) {
      throw new Error("Submit button not found in form");
    }
  }

  private initEventListeners(): void {
    this.createCardBtn.addEventListener("click", () => this.openModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.modal.addEventListener("click", (e) =>
      this.handleModalBackdropClick(e)
    );
    this.nameInput.addEventListener("blur", () =>
      this.validateFieldOnBlur(
        this.nameInput,
        validateDocumentName(this.nameInput.value)
      )
    );

    this.versionInput.addEventListener("blur", () =>
      this.validateFieldOnBlur(
        this.versionInput,
        validateVersion(this.versionInput.value)
      )
    );
  }

  private openModal(): void {
    this.modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  private closeModal(): void {
    this.modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    this.form.reset();
  }

  private handleModalBackdropClick(e: Event): void {
    if (e.target === this.modal) {
      this.closeModal();
    }
  }

  private validateFieldOnBlur(
    field: HTMLInputElement,
    validation: ReturnType<typeof validateDocumentName>
  ): void {
    const errorMessageId = `${field.id}-error`;
    let errorElement = document.getElementById(errorMessageId) as HTMLElement;

    if (!validation.valid) {
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.id = errorMessageId;
        errorElement.className = "error-message";
        field.parentNode?.insertBefore(errorElement, field.nextSibling);
      }
      errorElement.textContent = validation.error || "";
      field.classList.add("error");
    } else {
      field.classList.remove("error");
      if (errorElement) {
        errorElement.remove();
      }
    }

    this.updateSubmitButtonState();
  }

  private updateSubmitButtonState(): void {
    const nameValid = validateDocumentName(this.nameInput.value).valid;
    const versionValid = validateVersion(this.versionInput.value).valid;
    this.submitBtn.disabled = !nameValid || !versionValid;
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();

    const name = this.nameInput.value;
    const version = this.versionInput.value;
    const contributorsInput = (
      document.getElementById("doc-contributors") as HTMLTextAreaElement
    ).value;
    const attachmentsInput = (
      document.getElementById("doc-attachments") as HTMLTextAreaElement
    ).value;

    const formData: FormData = {
      name,
      version,
      contributors: contributorsInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c),
      attachments: attachmentsInput
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a),
    };

    if (this.submitCallback) {
      this.submitCallback(formData);
    }

    this.closeModal();
  }

  public onSubmit(callback: (data: FormData) => void): void {
    this.submitCallback = callback;
  }
}
