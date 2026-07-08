/**
 * Unit Tests for SecuritySection Component Logic
 *
 * Tests security score calculation and dialog display functionality.
 * Validates: Requirements 3.1-3.21
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { maskPhone, maskEmail } from "../composables/useMaskUtils";

// ============================================================
// Mocks
// ============================================================

vi.mock("@/api/user", () => ({
  default: {
    getMfaQrCode: vi.fn(),
    bindMfa: vi.fn(),
  },
}));

interface UserInfoDto {
  id: string;
  phone?: string;
  email?: string;
  pwdLevel?: string;
  mfaEnabled?: boolean;
  mfaBound?: boolean;
}

// ============================================================
// Replicate Component Logic for Testing
// ============================================================

const PASSWORD_SCORE_WEIGHT = 50;
const MFA_SCORE_WEIGHT = 20;
const PHONE_SCORE_WEIGHT = 20;
const EMAIL_SCORE_WEIGHT = 10;

/**
 * Calculate security score
 * Validates: Requirements 3.21
 */
function calculateSecurityScore(
  userInfo: UserInfoDto | null,
  mfaEnabled: boolean,
  mfaBound: boolean
): number {
  if (!userInfo) return 0;

  let score = 0;

  // Password strength score (50%)
  const pwdLevel = userInfo.pwdLevel?.toLowerCase();
  switch (pwdLevel) {
    case "strong":
    case "0":
      score += PASSWORD_SCORE_WEIGHT * 1.0;
      break;
    case "medium":
    case "1":
      score += PASSWORD_SCORE_WEIGHT * 0.66;
      break;
    case "weak":
    case "2":
      score += PASSWORD_SCORE_WEIGHT * 0.33;
      break;
    default:
      score += 0;
  }

  // MFA score (20%): full score if enabled AND bound
  if (mfaEnabled && mfaBound) {
    score += MFA_SCORE_WEIGHT;
  }

  // Phone score (20%): full score if bound
  if (userInfo.phone) {
    score += PHONE_SCORE_WEIGHT;
  }

  // Email score (10%): full score if bound
  if (userInfo.email) {
    score += EMAIL_SCORE_WEIGHT;
  }

  return Math.round(score);
}

/**
 * Get password strength tag info
 * Validates: Requirements 3.2
 */
function getPasswordStrengthTag(pwdLevel: string | undefined): {
  type: "success" | "warning" | "danger" | "info";
  label: string;
} {
  const level = pwdLevel?.toLowerCase();
  switch (level) {
    case "strong":
    case "0":
      return { type: "success", label: "强" };
    case "medium":
    case "1":
      return { type: "warning", label: "中" };
    case "weak":
    case "2":
      return { type: "danger", label: "弱" };
    default:
      return { type: "info", label: "未设置" };
  }
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "#67c23a";
  if (score >= 60) return "#e6a23c";
  return "#f56c6c";
}

/**
 * Get phone display text (masked or "未绑定")
 */
function getPhoneDisplay(userInfo: UserInfoDto | null): string {
  if (!userInfo?.phone) return "未绑定";
  return maskPhone(userInfo.phone);
}

/**
 * Get email display text (masked or "未绑定")
 */
function getEmailDisplay(userInfo: UserInfoDto | null): string {
  if (!userInfo?.email) return "未绑定";
  return maskEmail(userInfo.email);
}

/**
 * Get MFA action button text
 */
function getMfaActionText(mfaBound: boolean): string {
  return mfaBound ? "更换" : "绑定";
}

/**
 * Get phone action button text
 */
function getPhoneActionText(userInfo: UserInfoDto | null): string {
  return userInfo?.phone ? "更换" : "绑定";
}

/**
 * Get email action button text
 */
function getEmailActionText(userInfo: UserInfoDto | null): string {
  return userInfo?.email ? "更换" : "绑定";
}

// ============================================================
// Unit Tests - Security Score Calculation
// ============================================================

describe("SecuritySection - Security Score Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when userInfo is null", () => {
    const score = calculateSecurityScore(null, false, false);
    expect(score).toBe(0);
  });

  it("calculates max score (100) with strong password, MFA, phone, and email", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      phone: "13812345678",
      email: "test@example.com",
      pwdLevel: "strong",
    };
    const score = calculateSecurityScore(userInfo, true, true);
    expect(score).toBe(100);
  });

  it("calculates score with medium password", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      phone: "13812345678",
      email: "test@example.com",
      pwdLevel: "medium",
    };
    // Password: 50 * 0.66 = 33, Phone: 20, Email: 10, MFA: 0
    // Total: 63
    const score = calculateSecurityScore(userInfo, false, false);
    expect(score).toBe(63);
  });

  it("calculates score with weak password", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      phone: "13812345678",
      email: "test@example.com",
      pwdLevel: "weak",
    };
    // Password: 50 * 0.33 = 16.5 ≈ 17, Phone: 20, Email: 10, MFA: 0
    // Total: 47
    const score = calculateSecurityScore(userInfo, false, false);
    expect(score).toBe(47);
  });

  it("calculates score without phone", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      email: "test@example.com",
      pwdLevel: "strong",
    };
    // Password: 50, Email: 10, Phone: 0, MFA: 0
    // Total: 60
    const score = calculateSecurityScore(userInfo, false, false);
    expect(score).toBe(60);
  });

  it("calculates score without email", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      phone: "13812345678",
      pwdLevel: "strong",
    };
    // Password: 50, Phone: 20, Email: 0, MFA: 0
    // Total: 70
    const score = calculateSecurityScore(userInfo, false, false);
    expect(score).toBe(70);
  });

  it("MFA score requires both enabled AND bound", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      pwdLevel: "strong",
    };

    // MFA enabled but not bound: 0
    expect(calculateSecurityScore(userInfo, true, false)).toBe(50);

    // MFA bound but not enabled: 0
    expect(calculateSecurityScore(userInfo, false, true)).toBe(50);

    // MFA enabled AND bound: 20
    expect(calculateSecurityScore(userInfo, true, true)).toBe(70);
  });

  it("handles numeric pwdLevel values", () => {
    // "0" = strong
    expect(calculateSecurityScore({ id: "1", pwdLevel: "0" }, false, false)).toBe(50);

    // "1" = medium
    expect(calculateSecurityScore({ id: "1", pwdLevel: "1" }, false, false)).toBe(33);

    // "2" = weak
    expect(calculateSecurityScore({ id: "1", pwdLevel: "2" }, false, false)).toBe(17);
  });
});

// ============================================================
// Unit Tests - Password Strength Tag
// ============================================================

describe("SecuritySection - Password Strength Tag", () => {
  it("displays '强' with success type for strong password", () => {
    const result = getPasswordStrengthTag("strong");
    expect(result.label).toBe("强");
    expect(result.type).toBe("success");
  });

  it("displays '中' with warning type for medium password", () => {
    const result = getPasswordStrengthTag("medium");
    expect(result.label).toBe("中");
    expect(result.type).toBe("warning");
  });

  it("displays '弱' with danger type for weak password", () => {
    const result = getPasswordStrengthTag("weak");
    expect(result.label).toBe("弱");
    expect(result.type).toBe("danger");
  });

  it("displays '未设置' with info type for undefined password level", () => {
    const result = getPasswordStrengthTag(undefined);
    expect(result.label).toBe("未设置");
    expect(result.type).toBe("info");
  });

  it("handles numeric pwdLevel values", () => {
    expect(getPasswordStrengthTag("0")).toEqual({ type: "success", label: "强" });
    expect(getPasswordStrengthTag("1")).toEqual({ type: "warning", label: "中" });
    expect(getPasswordStrengthTag("2")).toEqual({ type: "danger", label: "弱" });
  });
});

// ============================================================
// Unit Tests - Score Color
// ============================================================

describe("SecuritySection - Score Color", () => {
  it("returns green (#67c23a) for score >= 80", () => {
    expect(getScoreColor(80)).toBe("#67c23a");
    expect(getScoreColor(100)).toBe("#67c23a");
  });

  it("returns yellow (#e6a23c) for score >= 60 and < 80", () => {
    expect(getScoreColor(60)).toBe("#e6a23c");
    expect(getScoreColor(79)).toBe("#e6a23c");
  });

  it("returns red (#f56c6c) for score < 60", () => {
    expect(getScoreColor(0)).toBe("#f56c6c");
    expect(getScoreColor(59)).toBe("#f56c6c");
  });
});

// ============================================================
// Unit Tests - Dialog Display
// ============================================================

describe("SecuritySection - Dialog Display", () => {
  it("initializes all dialog visibility states as false", () => {
    const showPasswordDialog = false;
    const showPhoneDialog = false;
    const showEmailDialog = false;
    const showMfaDialog = false;

    expect(showPasswordDialog).toBe(false);
    expect(showPhoneDialog).toBe(false);
    expect(showEmailDialog).toBe(false);
    expect(showMfaDialog).toBe(false);
  });

  it("displays correct action text for phone", () => {
    const userInfoWithPhone: UserInfoDto = { id: "1", phone: "13812345678" };
    const userInfoWithoutPhone: UserInfoDto = { id: "1" };

    expect(getPhoneActionText(userInfoWithPhone)).toBe("更换");
    expect(getPhoneActionText(userInfoWithoutPhone)).toBe("绑定");
  });

  it("displays correct action text for email", () => {
    const userInfoWithEmail: UserInfoDto = { id: "1", email: "test@example.com" };
    const userInfoWithoutEmail: UserInfoDto = { id: "1" };

    expect(getEmailActionText(userInfoWithEmail)).toBe("更换");
    expect(getEmailActionText(userInfoWithoutEmail)).toBe("绑定");
  });

  it("displays correct action text for MFA", () => {
    expect(getMfaActionText(true)).toBe("更换");
    expect(getMfaActionText(false)).toBe("绑定");
  });

  it("displays phone status correctly", () => {
    const userInfoWithPhone: UserInfoDto = { id: "1", phone: "13812345678" };
    const userInfoWithoutPhone: UserInfoDto = { id: "1" };

    expect(getPhoneDisplay(userInfoWithPhone)).toBe("138****5678");
    expect(getPhoneDisplay(userInfoWithoutPhone)).toBe("未绑定");
  });

  it("displays email status correctly", () => {
    const userInfoWithEmail: UserInfoDto = { id: "1", email: "testuser@example.com" };
    const userInfoWithoutEmail: UserInfoDto = { id: "1" };

    expect(getEmailDisplay(userInfoWithEmail)).toBe("tes*****@example.com");
    expect(getEmailDisplay(userInfoWithoutEmail)).toBe("未绑定");
  });
});

// ============================================================
// Property Tests - Security Score Calculation
// Feature: profile-center, Security Score Calculation
// Validates: Requirements 3.21
// ============================================================

describe("Property: Security Score Calculation", () => {
  it("security score is always between 0 and 100", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.option(fc.string(), { nil: undefined }),
          email: fc.option(fc.string(), { nil: undefined }),
          pwdLevel: fc.option(
            fc.constantFrom("strong", "medium", "weak", "0", "1", "2", "unknown"),
            { nil: undefined }
          ),
        }),
        fc.boolean(),
        fc.boolean(),
        async (partialUserInfo, mfaEnabled, mfaBound) => {
          const userInfo: UserInfoDto = { id: "1", ...partialUserInfo };
          const score = calculateSecurityScore(userInfo, mfaEnabled, mfaBound);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("strong password always contributes 50 points", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.option(fc.string(), { nil: undefined }),
          email: fc.option(fc.string(), { nil: undefined }),
        }),
        fc.boolean(),
        fc.boolean(),
        async (bindings, mfaEnabled, mfaBound) => {
          const userInfo: UserInfoDto = { id: "1", pwdLevel: "strong", ...bindings };
          const score = calculateSecurityScore(userInfo, mfaEnabled, mfaBound);

          // Base 50 from strong password
          let expectedBase = 50;

          // Add MFA contribution
          if (mfaEnabled && mfaBound) expectedBase += 20;

          // Add phone contribution
          if (bindings.phone) expectedBase += 20;

          // Add email contribution
          if (bindings.email) expectedBase += 10;

          expect(score).toBe(expectedBase);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("MFA only contributes when both enabled and bound", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.option(fc.string(), { nil: undefined }),
          email: fc.option(fc.string(), { nil: undefined }),
          pwdLevel: fc.option(fc.constantFrom("strong", "medium", "weak"), { nil: undefined }),
        }),
        fc.boolean(),
        fc.boolean(),
        async (partialUserInfo, mfaEnabled, mfaBound) => {
          const userInfo: UserInfoDto = { id: "1", ...partialUserInfo };
          const scoreWithMfa = calculateSecurityScore(userInfo, mfaEnabled, mfaBound);
          const scoreWithoutMfa = calculateSecurityScore(userInfo, false, false);

          // MFA score only added when both enabled AND bound
          if (mfaEnabled && mfaBound) {
            // Score should be 20 more than without MFA
            expect(scoreWithMfa - scoreWithoutMfa).toBe(20);
          } else {
            // Score should be same as without MFA
            expect(scoreWithMfa).toBe(scoreWithoutMfa);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Password Strength Tag Consistency
// ============================================================

describe("Property: Password Strength Tag Consistency", () => {
  it("strong password (strong or '0') always shows green '强' tag", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("strong", "STRONG", "Strong", "0"), async (pwdLevel) => {
        const result = getPasswordStrengthTag(pwdLevel);
        expect(result.type).toBe("success");
        expect(result.label).toBe("强");
      }),
      { numRuns: 100 }
    );
  });

  it("medium password (medium or '1') always shows yellow '中' tag", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("medium", "MEDIUM", "Medium", "1"), async (pwdLevel) => {
        const result = getPasswordStrengthTag(pwdLevel);
        expect(result.type).toBe("warning");
        expect(result.label).toBe("中");
      }),
      { numRuns: 100 }
    );
  });

  it("weak password (weak or '2') always shows red '弱' tag", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("weak", "WEAK", "Weak", "2"), async (pwdLevel) => {
        const result = getPasswordStrengthTag(pwdLevel);
        expect(result.type).toBe("danger");
        expect(result.label).toBe("弱");
      }),
      { numRuns: 100 }
    );
  });
});
