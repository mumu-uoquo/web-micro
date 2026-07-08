import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";

// ─────────────────────────────────────────────
// 内部工具函数
// ─────────────────────────────────────────────

/**
 * 生成基于时间因子的 AES 密钥（5 秒粒度）
 * 若当前时间距下一个窗口不足 100ms，直接取下一个窗口的 key，
 * 避免网络传输延迟导致服务端解密时窗口已切换
 * @param flag 是否需要考虑往后冗余100ms
 */
function _getTimedKey(flag: boolean = true): number {
  const time = Date.now();
  const key1 = Math.floor(time / 5000);
  if (flag) {
    // 常用于请求服务端时，考虑向后冗余100ms
    const key2 = Math.floor((time + 100) / 5000);
    return key1 !== key2 ? key2 : key1;
  } else {
    // 常用于解析后端数据，不用考虑向后冗余100ms
    return key1;
  }
}

/**
 * AES CBC/PKCS7 底层加密，key 不足 16 位时右补 0
 */
function _aesEncrypt(str: string, key: string): string {
  const paddedKey = key.padEnd(16, "0");
  const iv = CryptoJS.enc.Utf8.parse("");
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(str),
    CryptoJS.enc.Utf8.parse(paddedKey),
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

/**
 * AES CBC/PKCS7 底层解密，key 不足 16 位时右补 0
 */
function _aesDecrypt(hex: string, key: string): string {
  const paddedKey = key.padEnd(16, "0");
  const iv = CryptoJS.enc.Utf8.parse("");
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(hex),
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Utf8.parse(paddedKey), {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * MD5 底层实现
 */
function _md5(str: string): string {
  return CryptoJS.MD5(CryptoJS.enc.Utf8.parse(str)).toString(CryptoJS.enc.Hex);
}

// ─────────────────────────────────────────────
// encrypt 命名空间
// ─────────────────────────────────────────────

export const encrypt = {
  /**
   * MD5 加密，返回 32 位小写十六进制字符串
   * @param str 明文
   */
  md5(str: string): string {
    return _md5(str);
  },

  /**
   * SHA256 加密，返回 64 位小写十六进制字符串
   * @param str 明文
   */
  sha256(str: string): string {
    return CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(str)).toString(CryptoJS.enc.Hex);
  },

  /**
   * AES 加密（CBC + PKCS7），返回十六进制密文
   * @param str 明文
   * @param key 密钥（不足 16 位右补 0）
   */
  aes(str: string, key: string): string {
    return _aesEncrypt(str, key);
  },

  /**
   * AES 加密（时间因子密钥，5 秒粒度）
   * 用于需要时间窗口保护的场景
   * @param str 明文
   */
  taes(str: string): string {
    return _aesEncrypt(str, String(_getTimedKey()));
  },

  /**
   * RSA 公钥加密，返回十六进制密文
   * @param str 明文
   * @param publicKey PEM 格式公钥
   */
  rsa(str: string, publicKey: string): string {
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPublicKey(publicKey);
    const base64 = jsEncrypt.encrypt(str);
    if (base64 === false) {
      throw new Error("RSA 加密失败，请检查公钥格式");
    }
    // Base64 → Hex
    return CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Hex);
  },

  /**
   * 密码加密：
   * 1. 先对密码做 MD5 处理，避免明文传输
   * 2. 若提供了 RSA 公钥，则用 RSA 加密（安全性更高）
   * 3. 否则降级为 taes（时间因子 AES）加密
   * @param password 明文密码
   * @param rsaPublicKey RSA 公钥（PEM 格式），来自 settingsStore.rsaPublicKey
   */
  password(password: string, rsaPublicKey?: string): string {
    if (!password) return "";
    const hashed = _md5(password);
    // 优先尝试 RSA 加密
    if (rsaPublicKey) {
      try {
        return encrypt.rsa(hashed, rsaPublicKey);
      } catch {
        // RSA 加密失败，降级到 taes
      }
    }
    // 降级：taes 加密
    return _aesEncrypt(hashed, String(_getTimedKey()));
  },
};

// ─────────────────────────────────────────────
// decrypt 命名空间
// ─────────────────────────────────────────────

export const decrypt = {
  /**
   * AES 解密（CBC + PKCS7），输入十六进制密文
   * @param hex 十六进制密文
   * @param key 密钥（不足 16 位右补 0）
   */
  aes(hex: string, key: string): string {
    return _aesDecrypt(hex, key);
  },

  /**
   * AES 解密（时间因子密钥）
   * 解密失败时，自动用 key-1 和 key+1 重试，容忍跨窗口的时间偏差
   * @param hex 十六进制密文
   */
  taes(hex: string): string {
    if (!hex) return "";
    const key = _getTimedKey(false);
    for (const k of [key, key - 1, key + 1]) {
      try {
        const result = _aesDecrypt(hex, String(k));
        if (result) return result;
      } catch {
        // 继续尝试下一个 key
      }
    }
    throw new Error("taes 解密失败：时间因子不匹配");
  },

  /**
   * RSA 公钥解密（适用于服务端私钥加密、客户端公钥验证的场景）
   * @param hex 十六进制密文
   * @param publicKey PEM 格式公钥
   */
  rsa(hex: string, publicKey: string): string {
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPublicKey(publicKey);
    // Hex → Base64，再传给 JSEncrypt 解密
    const base64 = CryptoJS.enc.Hex.parse(hex).toString(CryptoJS.enc.Base64);
    const result = jsEncrypt.decrypt(base64);
    if (result === false) {
      throw new Error("RSA 解密失败，请检查公钥或密文");
    }
    return result;
  },
};
