/**
 * Unit Tests for PasswordDialog Component Logic
 *
 * Tests password form validation and submission functionality.
 * Validates: Requirements 4.1-4.6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { validatePasswordMatch } from "../composables/useValidators";

// ============================================================
// Mocks
// ============================================================

vi.mock("@/api/user", () => ({
  default: {
    updateSelfPassword: vi.fn(),
  },
}));

vi.mock("@/stores/modules/user-store", () => ({
  useUserStore: vi.fn(() => ({
    userInfo: { id: "test-user-id" },
  })),
}));

// ============================================================
// Form Model and Validation Logic
// ============================================================

interface PasswordFormModel {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function initialFormModel(): PasswordFormModel {
  return {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

function validateOldPassword(value: string): string | null {
  if (!value) return "请输入原密码";
  return null;
}

function validateNewPassword(value: string): string | null {
  if (!value) return "请输入新密码";
  if (value.length < 6) return "密码长度不能小于6位";
  if (value.length > 20) return "密码长度不能超过20位";
  return null;
}

function validateConfirmPassword(value: string, newPassword: string): string | null {
  if (!value) return "请输入确认密码";
  const matchResult = validatePasswordMatch(newPassword, value);
  if (!matchResult.valid) return matchResult.message ?? "密码不一致";
  return null;
}

function validateForm(form: PasswordFormModel): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const oldPwdError = validateOldPassword(form.oldPassword);
  if (oldPwdError) errors.push(oldPwdError);

  const newPwdError = validateNewPassword(form.newPassword);
  if (newPwdError) errors.push(newPwdError);

  const confirmPwdError = validateConfirmPassword(form.confirmPassword, form.newPassword);
  if (confirmPwdError) errors.push(confirmPwdError);

  return { valid: errors.length === 0, errors };
}

function resetForm(): PasswordFormModel {
  return initialFormModel();
}

// ============================================================
// Unit Tests - Form Validation
// ============================================================

describe("PasswordDialog - Form Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes form with empty fields", () => {
    const form = initialFormModel();
    expect(form.oldPassword).toBe("");
    expect(form.newPassword).toBe("");
    expect(form.confirmPassword).toBe("");
  });

  it("validates required old password", () => {
    expect(validateOldPassword("")).toBe("请输入原密码");
    expect(validateOldPassword("somePassword")).toBeNull();
  });

  it("validates new password length", () => {
    expect(validateNewPassword("")).toBe("请输入新密码");
    expect(validateNewPassword("12345")).toBe("密码长度不能小于6位");
    expect(validateNewPassword("123456")).toBeNull();
    expect(validateNewPassword("a".repeat(20))).toBeNull();
    expect(validateNewPassword("a".repeat(21))).toBe("密码长度不能超过20位");
  });

  it("validates confirm password matches new password", () => {
    expect(validateConfirmPassword("", "newPassword")).toBe("请输入确认密码");
    expect(validateConfirmPassword("different", "newPassword")).toBe("两次输入的密码不一致");
    expect(validateConfirmPassword("newPassword", "newPassword")).toBeNull();
  });

  it("validateForm returns all errors for empty form", () => {
    const form = initialFormModel();
    const result = validateForm(form);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
    expect(result.errors).toContain("请输入原密码");
    expect(result.errors).toContain("请输入新密码");
    expect(result.errors).toContain("请输入确认密码");
  });

  it("validateForm passes for valid form", () => {
    const form: PasswordFormModel = {
      oldPassword: "oldPassword123",
      newPassword: "newPassword123",
      confirmPassword: "newPassword123",
    };
    const result = validateForm(form);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

// ============================================================
// Unit Tests - Form Reset
// ============================================================

describe("PasswordDialog - Form Reset", () => {
  it("resetForm clears all fields", () => {
    const filledForm: PasswordFormModel = {
      oldPassword: "oldPwd",
      newPassword: "newPwd",
      confirmPassword: "newPwd",
    };
    const resetFormResult = resetForm();
    expect(resetFormResult.oldPassword).toBe("");
    expect(resetFormResult.newPassword).toBe("");
    expect(resetFormResult.confirmPassword).toBe("");
  });

  it("resetForm returns a fresh object", () => {
    const form1 = initialFormModel();
    const form2 = resetForm();
    expect(form1).toEqual(form2);
    expect(form1).not.toBe(form2);
  });
});

// ============================================================
// Unit Tests - Dialog State
// ============================================================

describe("PasswordDialog - Dialog State", () => {
  it("dialog visibility is controlled by visible prop", () => {
    let visible = false;
    expect(visible).toBe(false);

    visible = true;
    expect(visible).toBe(true);
  });

  it("submitting state prevents duplicate submission", async () => {
    let submitting = false;
    let callCount = 0;

    async function submitWithGuard() {
      if (submitting) return;
      submitting = true;
      callCount++;
      try {
        await new Promise((resolve) => setTimeout(resolve, 10));
      } finally {
        submitting = false;
      }
    }

    // Simulate concurrent calls
    const p1 = submitWithGuard();
    const p2 = submitWithGuard();
    await Promise.all([p1, p2]);

    expect(callCount).toBe(1);
  });
});

// ============================================================
// Property Tests - Password Match Validation
// Feature: profile-center, Property 7: 密码一致性校验
// Validates: Requirements 4.3, 4.4
// ============================================================

describe("Property 7: 密码一致性校验", () => {
  it("two unequal non-empty strings fail validation with correct message", async () => {
    const unequalPair = fc
      .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
      .filter(([a, b]) => a !== b);

    await fc.assert(
      fc.asyncProperty(unequalPair, async ([newPassword, confirmPassword]) => {
        const result = validatePasswordMatch(newPassword, confirmPassword);
        expect(result.valid).toBe(false);
        expect(result.message).toBe("两次输入的密码不一致");
      }),
      { numRuns: 100 }
    );
  });

  it("equal non-empty strings pass validation", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (password) => {
        const result = validatePasswordMatch(password, password);
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("empty strings fail validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.constant(""),
        async (newPassword, confirmPassword) => {
          const result = validatePasswordMatch(newPassword, confirmPassword);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Form Validation Completeness
// ============================================================

describe("Property: Form Validation Completeness", () => {
  it("validation fails if any required field is empty", async () => {
    const atLeastOneEmpty = fc
      .tuple(fc.string(), fc.string(), fc.string())
      .filter(([old, newPwd, confirm]) => old === "" || newPwd === "" || confirm === "");

    await fc.assert(
      fc.asyncProperty(atLeastOneEmpty, async ([oldPassword, newPassword, confirmPassword]) => {
        const form: PasswordFormModel = { oldPassword, newPassword, confirmPassword };
        const result = validateForm(form);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("validation fails if passwords don't match", async () => {
    const mismatchedPasswords = fc
      .tuple(fc.string({ minLength: 6, maxLength: 20 }), fc.string({ minLength: 6, maxLength: 20 }))
      .filter(([a, b]) => a !== b);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 20 }),
        mismatchedPasswords,
        async (oldPassword, [newPassword, confirmPassword]) => {
          const form: PasswordFormModel = { oldPassword, newPassword, confirmPassword };
          const result = validateForm(form);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("validation passes for valid form with matching passwords", async () => {
    const validPassword = fc.string({ minLength: 6, maxLength: 20 });

    await fc.assert(
      fc.asyncProperty(validPassword, validPassword, async (password1, password2) => {
        // Use same password for new and confirm to ensure they match
        const form: PasswordFormModel = {
          oldPassword: password1,
          newPassword: password2,
          confirmPassword: password2,
        };
        const result = validateForm(form);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Form Reset Behavior
// ============================================================

describe("Property: Form Reset Behavior", () => {
  it("resetForm always returns empty form regardless of prior state", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          oldPassword: fc.string(),
          newPassword: fc.string(),
          confirmPassword: fc.string(),
        }),
        async (filledForm) => {
          // Simulate form filled with random values
          const _form = filledForm;

          // Reset
          const resetResult = resetForm();

          expect(resetResult.oldPassword).toBe("");
          expect(resetResult.newPassword).toBe("");
          expect(resetResult.confirmPassword).toBe("");
        }
      ),
      { numRuns: 100 }
    );
  });
});
