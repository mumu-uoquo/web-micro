/**
 * Unit Tests for useValidators
 *
 * Tests validation functions for profile center.
 * Validates: Requirements 2.6, 3.2, 3.3, 3.6, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import {
  validateAvatarFile,
  validatePhone,
  validateEmail,
  validatePasswordMatch,
  createPhoneRule,
  createEmailRule,
} from "../composables/useValidators";

// ============================================================
// Unit Tests - validateAvatarFile
// ============================================================

describe("validateAvatarFile", () => {
  it("returns valid for file under 2MB", () => {
    const file = new File(["x".repeat(1024 * 1024)], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("returns valid for file exactly 2MB", () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 }); // exactly 2MB

    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it("returns invalid for file over 2MB", () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 + 1 }); // 2MB + 1 byte

    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("图片大小不能超过 2MB");
  });

  it("returns invalid for very large file", () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 }); // 10MB

    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("图片大小不能超过 2MB");
  });
});

// ============================================================
// Unit Tests - validatePhone
// ============================================================

describe("validatePhone", () => {
  it("validates correct Chinese mobile phone numbers", () => {
    const validPhones = ["13812345678", "15912345678", "18612345678", "17712345678", "19912345678"];

    validPhones.forEach((phone) => {
      const result = validatePhone(phone);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  it("rejects invalid phone numbers", () => {
    const invalidPhones = [
      "12345678901", // doesn't start with 1[3-9]
      "1381234567", // too short
      "138123456789", // too long
      "23812345678", // starts with 2
      "10812345678", // starts with 10
      "abcdefghijk", // non-numeric
      "", // empty
    ];

    invalidPhones.forEach((phone) => {
      const result = validatePhone(phone);
      expect(result.valid).toBe(false);
      expect(result.message).toBe("请输入正确的手机号码");
    });
  });
});

// ============================================================
// Unit Tests - validateEmail
// ============================================================

describe("validateEmail", () => {
  it("validates correct email addresses", () => {
    const validEmails = [
      "test@example.com",
      "user.name@example.com",
      "user+tag@example.com",
      "user@subdomain.example.com",
      "user@example.co.uk",
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  it("rejects invalid email addresses", () => {
    const invalidEmails = [
      "plainaddress",
      "@example.com",
      "user@",
      "user @example.com",
      "user@example .com",
      "",
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.message).toBe("请输入正确的邮箱地址");
    });
  });
});

// ============================================================
// Unit Tests - validatePasswordMatch
// ============================================================

describe("validatePasswordMatch", () => {
  it("returns valid when passwords match", () => {
    const result = validatePasswordMatch("password123", "password123");
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("returns invalid when passwords don't match", () => {
    const result = validatePasswordMatch("password123", "password456");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("两次输入的密码不一致");
  });

  it("returns invalid when only one is empty", () => {
    expect(validatePasswordMatch("", "password").valid).toBe(false);
    expect(validatePasswordMatch("password", "").valid).toBe(false);
  });

  it("returns valid when both are empty (technically matching)", () => {
    // Two empty strings are considered matching
    expect(validatePasswordMatch("", "").valid).toBe(true);
  });
});

// ============================================================
// Unit Tests - createPhoneRule
// ============================================================

describe("createPhoneRule", () => {
  const rules = createPhoneRule();

  it("creates array of two rules", () => {
    expect(rules.length).toBe(2);
    expect(rules[0].required).toBe(true);
    expect(rules[0].message).toBe("请输入手机号码");
  });

  it("second rule has validator function", () => {
    expect(typeof rules[1].validator).toBe("function");
  });
});

// ============================================================
// Unit Tests - createEmailRule
// ============================================================

describe("createEmailRule", () => {
  const rules = createEmailRule();

  it("creates array of two rules", () => {
    expect(rules.length).toBe(2);
    expect(rules[0].required).toBe(true);
    expect(rules[0].message).toBe("请输入邮箱地址");
  });

  it("second rule has validator function", () => {
    expect(typeof rules[1].validator).toBe("function");
  });
});

// ============================================================
// Property Tests - Avatar File Size Validation
// Feature: profile-center, Property 4: 头像文件大小校验
// Validates: Requirements 2.6
// ============================================================

describe("Property 4: 头像文件大小校验", () => {
  it("files over 2MB are always rejected", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 }),
        async (size) => {
          const file = new File([], "test.jpg", { type: "image/jpeg" });
          Object.defineProperty(file, "size", { value: size });

          const result = validateAvatarFile(file);
          expect(result.valid).toBe(false);
          expect(result.message).toBe("图片大小不能超过 2MB");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("files at or under 2MB are always accepted", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 2 * 1024 * 1024 }), async (size) => {
        const file = new File([], "test.jpg", { type: "image/jpeg" });
        Object.defineProperty(file, "size", { value: size });

        const result = validateAvatarFile(file);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Phone Format Validation
// Feature: profile-center, Property 5: 手机号格式校验
// Validates: Requirements 3.2, 3.6
// ============================================================

describe("Property 5: 手机号格式校验", () => {
  it("valid phones match regex pattern", async () => {
    // Generate valid phone: 1 + [3-9] + 9 digits
    const validPhoneArb = fc
      .tuple(fc.constantFrom("3", "4", "5", "6", "7", "8", "9"), fc.nat(999999999))
      .map(([firstDigit, rest]) => "1" + firstDigit + rest.toString().padStart(9, "0"));

    await fc.assert(
      fc.asyncProperty(validPhoneArb, async (phone) => {
        const result = validatePhone(phone);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("invalid phones are rejected", async () => {
    const invalidPhoneArb = fc.string().filter((s) => !/^1[3-9]\d{9}$/.test(s));

    await fc.assert(
      fc.asyncProperty(invalidPhoneArb, async (phone) => {
        const result = validatePhone(phone);
        expect(result.valid).toBe(false);
        expect(result.message).toBe("请输入正确的手机号码");
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Email Format Validation
// Feature: profile-center, Property 6: 邮箱格式校验
// Validates: Requirements 3.3, 3.6
// ============================================================

describe("Property 6: 邮箱格式校验", () => {
  it("valid emails pass validation", async () => {
    // Generate valid email: local@domain.tld
    const validEmailArb = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9._%+-]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
        fc.string({ minLength: 2, maxLength: 5 }).filter((s) => /^[a-zA-Z]+$/.test(s))
      )
      .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    await fc.assert(
      fc.asyncProperty(validEmailArb, async (email) => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("emails without @ symbol are rejected", async () => {
    const noAtEmailArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes("@"));

    await fc.assert(
      fc.asyncProperty(noAtEmailArb, async (email) => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.message).toBe("请输入正确的邮箱地址");
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Password Match Validation
// Feature: profile-center, Property 7: 密码一致性校验
// Validates: Requirements 4.3, 4.4
// ============================================================

describe("Property 7: 密码一致性校验", () => {
  it("matching non-empty passwords always pass", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (password) => {
        const result = validatePasswordMatch(password, password);
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("non-matching passwords always fail", async () => {
    const mismatchedArb = fc
      .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
      .filter(([a, b]) => a !== b);

    await fc.assert(
      fc.asyncProperty(mismatchedArb, async ([pwd1, pwd2]) => {
        const result = validatePasswordMatch(pwd1, pwd2);
        expect(result.valid).toBe(false);
        expect(result.message).toBe("两次输入的密码不一致");
      }),
      { numRuns: 100 }
    );
  });
});
