// MIME类型到文件扩展名的映射字典
const mimeTypeExtensions: Record<string, string> = {
  // 文档类型
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/rtf": "rtf",
  "application/json": "json",
  "application/xml": "xml",
  // 图像类型
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  // 音频类型
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "audio/webm": "weba",
  // 视频类型
  "video/mp4": "mp4",
  "video/mpeg": "mpeg",
  "video/ogg": "ogv",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  // 压缩文件
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
  "application/x-tar": "tar",
  "application/gzip": "gz",
  // 其他常见类型
  "application/octet-stream": "bin",
  "text/html": "html",
  "text/css": "css",
  "application/javascript": "js",
  "application/wasm": "wasm",
};

// 主类型到文件类别前缀的映射
const mainTypePrefixes: Record<string, string> = {
  application: "file",
  text: "document",
  image: "image",
  audio: "audio",
  video: "video",
  font: "font",
};

/**
 * 文件工具类
 *
 * 注意：upload 和 uploadByChunk 方法依赖 DfsAPI，需在调用方注入。
 * shared 包仅提供与 DFS 无关的通用文件工具方法。
 */
const FileUtil = {
  /**
   * 将 File 对象转换为 Base64
   */
  file2Base64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * 将 Blob 对象转换为 Base64
   */
  blob2Base64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * 从 Base64 创建 Blob 对象
   */
  base64ToBlob(base64: string, mimeType: string = ""): Blob {
    // 如果包含 data URL 前缀，先提取纯 base64
    const pureBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

    const byteCharacters = atob(pureBase64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  },

  /**
   * 根据文件类型或者文件名后缀判断是否图片
   */
  isPicture(mimeType: string, fileName: string): boolean {
    // 1. 优先用 MIME 类型校验
    if (mimeType) {
      return mimeType.startsWith("image/");
    }
    // 2. 获取文件后缀
    const suffix = this.getSuffix(fileName);
    if (!suffix) {
      return false;
    }
    // 3. 检查后缀是否在图片白名单中
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "tiff",
      "ico",
      "heic",
      "heif",
    ];
    return imageExtensions.includes(suffix);
  },

  /**
   * 获取文件后缀
   */
  getSuffix(fileName: string): string {
    // 1. 处理边界情况：文件名不存在/为空
    if (!fileName || typeof fileName !== "string") {
      return "";
    }
    // 2. 提取文件后缀（处理多后缀场景如 "file.tar.gz"）
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return "";
    }
    // 3. 截取后缀并转为小写（统一匹配规则）
    const suffix = fileName.slice(lastDotIndex + 1).toLowerCase();
    return suffix;
  },

  /**
   * 解析 Content-Disposition 头中的文件名
   */
  parseFileNameByDisposition(contentDisposition: string): string {
    if (!contentDisposition) return "";

    try {
      // 1. 首先尝试RFC 5987编码 (filename*=utf-8'')
      const rfc5987Regex = /filename\*=(?:UTF-8|utf-8)''([^;]+)/i;
      const rfc5987Match = contentDisposition.match(rfc5987Regex);
      if (rfc5987Match && rfc5987Match[1]) {
        return decodeURIComponent(rfc5987Match[1]);
      }

      // 2. 尝试标准filename参数
      const filenameRegex = /filename=["']?([^;"']+)["']?/i;
      const filenameMatch = contentDisposition.match(filenameRegex);
      if (filenameMatch && filenameMatch[1]) {
        const filename = filenameMatch[1].trim();
        // 检查是否包含编码字符
        if (filename.includes("%")) {
          try {
            return decodeURIComponent(filename);
          } catch {
            return filename;
          }
        }
        return filename;
      }

      return "";
    } catch (error) {
      console.error("解析Content-Disposition失败:", error);
      return "";
    }
  },

  /**
   * 根据 Content-Type 生成默认文件名
   */
  generateFileNameByContentType(contentType: string): string {
    // 生成时间戳（格式：YYYYMMDD_HHmmss）
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
    if (!contentType) {
      return `download_${timestamp}.bin`;
    }

    // 清理content-type（可能包含字符集等信息）
    const cleanType = contentType.split(";")[0].trim();
    // 获取主类型和子类型
    const [mainType, subType] = cleanType.split("/");

    // 确定文件扩展名
    let extension =
      mimeTypeExtensions[cleanType] ||
      mimeTypeExtensions[`${mainType}/${subType}`] ||
      subType ||
      "bin";
    // 如果扩展名超过10个字符，使用简写
    if (extension.length > 10) {
      extension = "dat";
    }
    // 确定文件名前缀
    const prefix = mainTypePrefixes[mainType] || "download";

    return `${prefix}_${timestamp}.${extension}`;
  },
};

export default FileUtil;

/**
 * 入参:获取分块上传配置信息
 */
export interface UploadConfigParam {
  /** 临时上传码 */
  uploadCode: string;
  /** 未完成的块列表 */
  chunkList: number[];
  /** 分块大小（byte） */
  chunkSize: number;
  /** 重试次数 */
  retryAttempts?: number;
  /** 进度回调 */
  onProgress: (percent: number) => void;
}
