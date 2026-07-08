/**
 * 断言
 */
export function assert(condition: any, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * 日期范围
 * @param days 天数（负数表示过去）
 * @param end 默认当天
 */
export function getRangeDate(days: number = -7, end: Date = new Date()): [Date, Date] {
  // 结束日期
  end.setMinutes(59);
  end.setSeconds(59);
  // 起始日期
  const start = new Date();
  start.setTime(end.getTime() + 3600 * 1000 * 24 * days);
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  return [start, end];
}

/**
 * 生成唯一标识（UUID v4 格式）
 */
export function guid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 密码强度判断
 * 极弱：<10, 弱：<20, 中：<30, 强：<40, 极强：>50
 */
export function passwordComplex(str: string): number {
  let score = 0;
  if (!str) {
    return score;
  }
  const pwdArr = str.split("");
  // 长度判断
  if (pwdArr.length > 7) {
    score += 10; // 长度在7以上，加10分
  } else if (pwdArr.length > 4) {
    score += 5; // 长度在4-7之间，加5分
  } else if (pwdArr.length < 3) {
    return 0; // 密码长度必须大于3
  }
  // 小写字母
  if (
    pwdArr.some((item) => {
      return /^[a-z]$/.test(item);
    })
  ) {
    score += 5;
  }
  // 大写字母
  if (
    pwdArr.some((item) => {
      return /^[A-Z]$/.test(item);
    })
  ) {
    score += 5;
  }
  // 数字
  if (
    pwdArr.some((item) => {
      return /^[0-9]$/.test(item);
    })
  ) {
    let count = 0;
    pwdArr.forEach((item) => {
      if (/^[0-9]$/.test(item)) {
        count++;
      }
    });
    score += count >= 3 ? 10 : 5;
  }
  // 特殊字符
  if (
    pwdArr.some((item) => {
      return /^[\^%&'*.,;=+\-?@#!$\x22]$/.test(item);
    })
  ) {
    let count = 0;
    pwdArr.forEach((item) => {
      if (/^[\^%&'*.,;=+\-?@#!$\x22]$/.test(item)) {
        count++;
      }
    });
    score += count >= 2 ? 15 : 5;
  }
  // 是否连续
  let isContinued: boolean = false;
  let countinuedCount: number = 0;
  for (let i = 1; i < pwdArr.length - 1; i++) {
    const a = pwdArr[i - 1];
    const b = pwdArr[i];
    const c = pwdArr[i + 1];
    if (b.charCodeAt(0) - 1 == a.charCodeAt(0) || b.charCodeAt(0) + 1 == c.charCodeAt(0)) {
      isContinued = true;
      countinuedCount++;
    } else if (isContinued) {
      if (countinuedCount >= 3) {
        return 0;
      }
      isContinued = false;
      score -= countinuedCount;
      countinuedCount = 0;
    }
  }
  score -= countinuedCount;
  if (countinuedCount >= 3) {
    return 0;
  }
  // 单一字符
  for (let i = 0; i < pwdArr.length - 1; i++) {
    if (pwdArr[i] != pwdArr[i + 1]) {
      break;
    }
    if (i == pwdArr.length - 2) {
      score = 0;
    }
  }
  return score;
}
