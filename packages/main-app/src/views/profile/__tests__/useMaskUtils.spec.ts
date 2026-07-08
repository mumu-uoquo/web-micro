/**
 * Unit Tests for useMaskUtils
 *
 * Tests mask utility functions for profile center data masking.
 * Validates: Requirements 1.8, 1.9, 1.10, 5.2, 5.4
 */

import { describe, it, expect } from "vitest";
import { maskRealName, maskPhone, maskEmail, useMaskUtils } from "../composables/useMaskUtils";

// ============================================================
// maskRealName Tests
// ============================================================

describe("maskRealName", () => {
  describe("empty string and null/undefined handling", () => {
    it("returns empty string when input is empty string", () => {
      expect(maskRealName("")).toBe("");
    });

    it("returns null when input is null", () => {
      expect(maskRealName(null as any)).toBe(null);
    });

    it("returns undefined when input is undefined", () => {
      expect(maskRealName(undefined as any)).toBe(undefined);
    });
  });

  describe("single character name", () => {
    it("returns single character as-is", () => {
      expect(maskRealName("张")).toBe("张");
    });

    it("returns single character as-is for non-Chinese", () => {
      expect(maskRealName("A")).toBe("A");
    });
  });

  describe("two character names", () => {
    it('masks "张三" to "张*"', () => {
      expect(maskRealName("张三")).toBe("张*");
    });

    it('masks "李四" to "李*"', () => {
      expect(maskRealName("李四")).toBe("李*");
    });

    it("masks two character non-Chinese names", () => {
      expect(maskRealName("AB")).toBe("A*");
    });
  });

  describe("three character names", () => {
    it('masks "张三明" to "张*明"', () => {
      expect(maskRealName("张三明")).toBe("张*明");
    });

    it('masks "李四五" to "李*五"', () => {
      expect(maskRealName("李四五")).toBe("李*五");
    });

    it("masks three character non-Chinese names", () => {
      expect(maskRealName("ABC")).toBe("A*C");
    });
  });

  describe("four+ character names", () => {
    it('masks "张三四明" to "张**明"', () => {
      expect(maskRealName("张三四明")).toBe("张**明");
    });

    it('masks "王五六七八" to "王***八"', () => {
      expect(maskRealName("王五六七八")).toBe("王***八");
    });

    it("masks four character non-Chinese names", () => {
      expect(maskRealName("ABCD")).toBe("A**D");
    });

    it("masks five character names", () => {
      expect(maskRealName("ABCDE")).toBe("A***E");
    });

    it("masks long names correctly", () => {
      // 5 chars: first + (5-2=3) asterisks + last
      expect(maskRealName("张三李四王")).toBe("张***王");
    });
  });
});

// ============================================================
// maskPhone Tests
// ============================================================

describe("maskPhone", () => {
  describe("empty string and null/undefined handling", () => {
    it("returns empty string when input is empty string", () => {
      expect(maskPhone("")).toBe("");
    });

    it("returns null when input is null", () => {
      expect(maskPhone(null as any)).toBe(null);
    });

    it("returns undefined when input is undefined", () => {
      expect(maskPhone(undefined as any)).toBe(undefined);
    });
  });

  describe("phone numbers less than 7 characters", () => {
    it("returns as-is for 3 character phone", () => {
      expect(maskPhone("138")).toBe("138");
    });

    it("returns as-is for 6 character phone", () => {
      expect(maskPhone("138123")).toBe("138123");
    });

    it("returns as-is for single digit", () => {
      expect(maskPhone("1")).toBe("1");
    });
  });

  describe("standard 11-digit phone numbers", () => {
    it('masks "13812345678" to "138****5678"', () => {
      expect(maskPhone("13812345678")).toBe("138****5678");
    });

    it('masks "15987654321" to "159****4321"', () => {
      expect(maskPhone("15987654321")).toBe("159****4321");
    });

    it('masks "18600001111" to "186****1111"', () => {
      expect(maskPhone("18600001111")).toBe("186****1111");
    });

    it("preserves first 3 digits", () => {
      expect(maskPhone("12345678901").slice(0, 3)).toBe("123");
    });

    it("preserves last 4 digits", () => {
      expect(maskPhone("12345678901").slice(7)).toBe("8901");
    });

    it("has exactly 4 asterisks in the middle", () => {
      const masked = maskPhone("13812345678");
      expect(masked.slice(3, 7)).toBe("****");
    });
  });

  describe("non-standard length phones (7+ chars but not 11)", () => {
    it("masks 10-digit phone (7 chars min)", () => {
      // 10 digits: first 3 + **** + last 3 (slice(7) for 10 chars gives 3 chars)
      expect(maskPhone("1381234567")).toBe("138****567");
    });

    it("masks 12-digit phone", () => {
      // 12 digits: first 3 + **** + last 5
      expect(maskPhone("138123456789")).toBe("138****56789");
    });
  });
});

// ============================================================
// maskEmail Tests
// ============================================================

describe("maskEmail", () => {
  describe("empty string and null/undefined handling", () => {
    it("returns empty string when input is empty string", () => {
      expect(maskEmail("")).toBe("");
    });

    it("returns null when input is null", () => {
      expect(maskEmail(null as any)).toBe(null);
    });

    it("returns undefined when input is undefined", () => {
      expect(maskEmail(undefined as any)).toBe(undefined);
    });
  });

  describe("email without @ symbol", () => {
    it("returns as-is when no @ symbol", () => {
      expect(maskEmail("testemail")).toBe("testemail");
    });

    it("returns plain text as-is", () => {
      expect(maskEmail("no-at-symbol")).toBe("no-at-symbol");
    });
  });

  describe("email with username <= 3 characters", () => {
    it('returns as-is for "a@example.com"', () => {
      expect(maskEmail("a@example.com")).toBe("a@example.com");
    });

    it('returns as-is for "ab@example.com"', () => {
      expect(maskEmail("ab@example.com")).toBe("ab@example.com");
    });

    it('returns as-is for "abc@example.com"', () => {
      expect(maskEmail("abc@example.com")).toBe("abc@example.com");
    });
  });

  describe("email with username > 3 characters", () => {
    it('masks "zhangsan@example.com" to "zha*****@example.com"', () => {
      // zhangsan = 8 chars, keep first 3, replace remaining 5 with *
      expect(maskEmail("zhangsan@example.com")).toBe("zha*****@example.com");
    });

    it('masks "lisi@example.com" to "lis*@example.com"', () => {
      // lisi = 4 chars, keep first 3, replace remaining 1 with *
      expect(maskEmail("lisi@example.com")).toBe("lis*@example.com");
    });

    it('masks "wangwu@example.cn" to "wan***@example.cn"', () => {
      // wangwu = 6 chars, keep first 3, replace remaining 3 with *
      expect(maskEmail("wangwu@example.cn")).toBe("wan***@example.cn");
    });

    it("preserves domain part exactly", () => {
      // testuser = 8 chars, keep first 3, replace remaining 5 with *
      expect(maskEmail("testuser@domain.org")).toBe("tes*****@domain.org");
    });

    it("handles long usernames", () => {
      // verylongusername = 16 chars, keep first 3, replace remaining 13 with *
      expect(maskEmail("verylongusername@company.com")).toBe("ver*************@company.com");
    });
  });

  describe("edge cases", () => {
    it("handles email with multiple @ symbols (uses first one)", () => {
      // The function uses indexOf('@') which finds the first @
      // test@user = 9 chars (test@user), but username is "test" = 4 chars
      // Keep first 3, replace 1 with *
      expect(maskEmail("test@user@domain.com")).toBe("tes*@user@domain.com");
    });

    it("handles username exactly 4 characters", () => {
      expect(maskEmail("test@example.com")).toBe("tes*@example.com");
    });

    it("handles username exactly 5 characters", () => {
      expect(maskEmail("tests@example.com")).toBe("tes**@example.com");
    });
  });
});

// ============================================================
// useMaskUtils composable Tests
// ============================================================

describe("useMaskUtils", () => {
  it("returns object with maskRealName, maskPhone, maskEmail functions", () => {
    const utils = useMaskUtils();
    expect(typeof utils.maskRealName).toBe("function");
    expect(typeof utils.maskPhone).toBe("function");
    expect(typeof utils.maskEmail).toBe("function");
  });

  it("returned functions work correctly", () => {
    const { maskRealName: mrn, maskPhone: mp, maskEmail: me } = useMaskUtils();

    expect(mrn("张三")).toBe("张*");
    expect(mp("13812345678")).toBe("138****5678");
    expect(me("test@example.com")).toBe("tes*@example.com");
  });
});
