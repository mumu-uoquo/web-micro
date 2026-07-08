import CryptoJS from 'crypto-js'

/**
 * AES-CBC 加密
 * @param {string} text - 明文字符串
 * @param {string} key  - 16/24/32 字节 AES 密钥
 * @param {string} iv   - 16 字节初始向量
 * @returns {string} Base64 编码的密文
 * @throws {Error} 加密失败时抛出
 */
export function encrypt(text, key, iv) {
  try {
    const keyWA = CryptoJS.enc.Utf8.parse(key)
    const ivWA  = CryptoJS.enc.Utf8.parse(iv)
    const encrypted = CryptoJS.AES.encrypt(text, keyWA, {
      iv: ivWA,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    return encrypted.toString() // Base64
  } catch (e) {
    throw new Error(`AES 加密失败: ${e.message}`)
  }
}

/**
 * AES-CBC 解密
 * @param {string} ciphertext - Base64 编码的密文
 * @param {string} key        - 16/24/32 字节 AES 密钥
 * @param {string} iv         - 16 字节初始向量
 * @returns {string} 原始明文字符串
 * @throws {Error} 解密失败时抛出
 */
export function decrypt(ciphertext, key, iv) {
  try {
    const keyWA = CryptoJS.enc.Utf8.parse(key)
    const ivWA  = CryptoJS.enc.Utf8.parse(iv)
    const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWA, {
      iv: ivWA,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
    if (!plaintext) {
      throw new Error('解密结果为空，密钥或 IV 可能不正确')
    }
    return plaintext
  } catch (e) {
    // 避免双重包装（e 本身已经是 AES 解密失败的错误时直接重抛包装）
    if (e.message.startsWith('AES 解密失败:')) throw e
    throw new Error(`AES 解密失败: ${e.message}`)
  }
}
