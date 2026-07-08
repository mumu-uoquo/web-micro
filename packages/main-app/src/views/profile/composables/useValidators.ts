import type { FormItemRule } from "element-plus";

const phoneRegex = /^1[3-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAvatarFile(file: File): { valid: boolean; message?: string } {
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, message: "图片大小不能超过 2MB" };
  }
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: "请输入正确的手机号码" };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!emailRegex.test(email)) {
    return { valid: false, message: "请输入正确的邮箱地址" };
  }
  return { valid: true };
}

export function validatePasswordMatch(
  newPassword: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (newPassword !== confirmPassword) {
    return { valid: false, message: "两次输入的密码不一致" };
  }
  return { valid: true };
}

export function createPhoneRule(): FormItemRule[] {
  return [
    { required: true, message: "请输入手机号码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        const result = validatePhone(value);
        if (!result.valid) {
          callback(new Error(result.message));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ];
}

export function createEmailRule(): FormItemRule[] {
  return [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        const result = validateEmail(value);
        if (!result.valid) {
          callback(new Error(result.message));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ];
}
