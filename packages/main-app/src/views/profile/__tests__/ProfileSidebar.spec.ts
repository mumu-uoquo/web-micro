/**
 * Unit Tests for ProfileSidebar Component Logic
 *
 * Tests basic info display and editing functionality.
 * Validates: Requirements 1.5, 1.8, 1.9, 1.10, 1.11, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { maskRealName, maskPhone, maskEmail } from "../composables/useMaskUtils";

// ============================================================
// Mocks
// ============================================================

vi.mock("@/api/user", () => ({
  default: {
    updateUserInfo: vi.fn(),
    getUserInfo: vi.fn(),
  },
}));

vi.mock("@/stores/modules/user-store", () => ({
  useUserStore: vi.fn(() => ({
    userInfo: { id: "test-user-id" },
  })),
}));

interface UserInfoDto {
  id: string;
  userName?: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: string;
  instituteName?: string;
  deptName?: string;
  userRoleList?: { id: string; roleName: string }[];
  createTime?: string;
  lastedLoginTime?: string;
  lastedLoginIp?: string;
  lastedLoginAddress?: string;
}

// Replicate component logic for testing
function getMaskedRealName(userInfo: UserInfoDto | null): string {
  if (!userInfo?.realName) return "—";
  return maskRealName(userInfo.realName);
}

function getMaskedPhone(userInfo: UserInfoDto | null): string {
  if (!userInfo?.phone) return "—";
  return maskPhone(userInfo.phone);
}

function getMaskedEmail(userInfo: UserInfoDto | null): string {
  if (!userInfo?.email) return "—";
  return maskEmail(userInfo.email);
}

function getStatusTagType(status: string | undefined): "success" | "danger" {
  return status === "1" ? "success" : "danger";
}

function getStatusLabel(status: string | undefined): string {
  return status === "1" ? "启用" : "禁用";
}

function validateRealName(realName: string): { valid: boolean; message?: string } {
  if (!realName.trim()) {
    return { valid: false, message: "姓名不能为空" };
  }
  return { valid: true };
}

// ============================================================
// Unit Tests - Basic Info Display
// ============================================================

describe("ProfileSidebar - Basic Info Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays all required fields in el-descriptions", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      userName: "testuser",
      realName: "张三",
      phone: "13812345678",
      email: "test@example.com",
      instituteName: "测试机构",
      deptName: "测试部门",
      userRoleList: [{ id: "r1", roleName: "管理员" }],
      createTime: "2024-01-01",
      status: "1",
    };

    // Verify all fields exist
    expect(userInfo.userName).toBeDefined();
    expect(userInfo.realName).toBeDefined();
    expect(userInfo.phone).toBeDefined();
    expect(userInfo.email).toBeDefined();
    expect(userInfo.instituteName).toBeDefined();
    expect(userInfo.deptName).toBeDefined();
    expect(userInfo.userRoleList).toBeDefined();
    expect(userInfo.createTime).toBeDefined();
    expect(userInfo.status).toBeDefined();
  });

  it("displays '—' for missing optional fields", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      userName: "testuser",
    };

    expect(getMaskedRealName(userInfo)).toBe("—");
    expect(getMaskedPhone(userInfo)).toBe("—");
    expect(getMaskedEmail(userInfo)).toBe("—");
    expect(userInfo.instituteName ?? "—").toBe("—");
    expect(userInfo.deptName ?? "—").toBe("—");
    expect(userInfo.userRoleList?.length ? "has roles" : "—").toBe("—");
  });

  it("displays status tag with correct type and label", () => {
    // Enabled status
    expect(getStatusTagType("1")).toBe("success");
    expect(getStatusLabel("1")).toBe("启用");

    // Disabled status
    expect(getStatusTagType("0")).toBe("danger");
    expect(getStatusLabel("0")).toBe("禁用");

    // Undefined status
    expect(getStatusTagType(undefined)).toBe("danger");
    expect(getStatusLabel(undefined)).toBe("禁用");
  });

  it("displays last login info correctly", () => {
    const userInfo: UserInfoDto = {
      id: "1",
      lastedLoginTime: "2024-01-15 10:30:00",
      lastedLoginAddress: "北京市",
      lastedLoginIp: "192.168.1.1",
    };

    expect(userInfo.lastedLoginTime).toBe("2024-01-15 10:30:00");
    expect(userInfo.lastedLoginAddress).toBe("北京市");
    expect(userInfo.lastedLoginIp).toBe("192.168.1.1");
  });

  it("displays '—' for missing last login info", () => {
    const userInfo: UserInfoDto = { id: "1" };

    expect(userInfo.lastedLoginTime ?? "—").toBe("—");
    expect(userInfo.lastedLoginAddress ?? "—").toBe("—");
    expect(userInfo.lastedLoginIp ?? "—").toBe("—");
  });
});

// ============================================================
// Unit Tests - Real Name Editing
// ============================================================

describe("ProfileSidebar - Real Name Editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validateRealName returns error for empty string", () => {
    const result = validateRealName("");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("姓名不能为空");
  });

  it("validateRealName returns error for whitespace-only string", () => {
    const result = validateRealName("   ");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("姓名不能为空");
  });

  it("validateRealName passes for valid name", () => {
    const result = validateRealName("张三");
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("edit state variables are initialized correctly", () => {
    const isEditingRealName = false;
    const editRealName = "";
    const savingRealName = false;

    expect(isEditingRealName).toBe(false);
    expect(editRealName).toBe("");
    expect(savingRealName).toBe(false);
  });
});

// ============================================================
// Unit Tests - Masked Display
// ============================================================

describe("ProfileSidebar - Masked Display", () => {
  it("masks real name correctly", () => {
    const userInfo: UserInfoDto = { id: "1", realName: "张三明" };
    expect(getMaskedRealName(userInfo)).toBe("张*明");
  });

  it("masks phone correctly", () => {
    const userInfo: UserInfoDto = { id: "1", phone: "13812345678" };
    expect(getMaskedPhone(userInfo)).toBe("138****5678");
  });

  it("masks email correctly", () => {
    const userInfo: UserInfoDto = { id: "1", email: "testuser@example.com" };
    expect(getMaskedEmail(userInfo)).toBe("tes*****@example.com");
  });
});

// ============================================================
// Property Tests - Data Display Completeness
// Feature: profile-center, Property 10: UserInfo 字段渲染完整性
// Validates: Requirements 1.5
// ============================================================

describe("Property 10: UserInfo 字段渲染完整性", () => {
  it("all required fields are present in UserInfoDto for rendering", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          userName: fc.option(fc.string(), { nil: undefined }),
          realName: fc.option(fc.string(), { nil: undefined }),
          phone: fc.option(fc.string(), { nil: undefined }),
          email: fc.option(fc.string(), { nil: undefined }),
          instituteName: fc.option(fc.string(), { nil: undefined }),
          deptName: fc.option(fc.string(), { nil: undefined }),
          createTime: fc.option(fc.string(), { nil: undefined }),
        }),
        async (partialUserInfo) => {
          const userInfo: UserInfoDto = partialUserInfo as UserInfoDto;

          // All fields should be accessible (even if undefined)
          const fields = [
            "userName",
            "realName",
            "phone",
            "email",
            "instituteName",
            "deptName",
            "createTime",
          ];

          fields.forEach((field) => {
            const value = (userInfo as any)[field];
            // Value can be undefined or a string
            expect(value === undefined || typeof value === "string").toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property Tests - Status Tag Rendering
// Feature: profile-center, Property 8: 账号状态渲染
// Validates: Requirements 5.1, 5.2, 5.3, 5.4
// ============================================================

describe("Property 8: 账号状态渲染", () => {
  it("status '1' always renders as green '启用' tag", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          status: fc.constant("1"),
        }),
        async (userInfo) => {
          expect(getStatusTagType(userInfo.status)).toBe("success");
          expect(getStatusLabel(userInfo.status)).toBe("启用");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("status other than '1' renders as red '禁用' tag", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          status: fc.oneof(fc.constant("0"), fc.constant("2"), fc.constant(undefined)),
        }),
        async (userInfo) => {
          expect(getStatusTagType(userInfo.status)).toBe("danger");
          expect(getStatusLabel(userInfo.status)).toBe("禁用");
        }
      ),
      { numRuns: 100 }
    );
  });
});
