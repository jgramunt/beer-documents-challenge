export interface ValidationResult {
  valid: boolean;
  error?: string;
}

import { VALIDATION_CONFIG } from "../config/constants.js";

/**
 * Handles validation result - shows alert if invalid and returns validity
 */
export function handleValidation(validation: ValidationResult): boolean {
  if (!validation.valid) {
    alert(validation.error);
    return false;
  }
  return true;
}

export function validateDocumentName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Document name is required" };
  }

  if (name.trim().length < VALIDATION_CONFIG.MIN_NAME_LENGTH) {
    return {
      valid: false,
      error: `Document name must be at least ${VALIDATION_CONFIG.MIN_NAME_LENGTH} characters`,
    };
  }

  if (name.trim().length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Document name must be less than ${VALIDATION_CONFIG.MAX_NAME_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validateVersion(version: string): ValidationResult {
  if (!version || version.trim().length === 0) {
    return { valid: false, error: "Version is required" };
  }

  if (!isValidSemVer(version.trim())) {
    return {
      valid: false,
      error: "Version must follow semantic versioning format (e.g., 1.0.0)",
    };
  }

  return { valid: true };
}

function isValidSemVer(version: string): boolean {
  const semVerRegex = /^\d+\.\d+\.\d+$/;
  return semVerRegex.test(version);
}
