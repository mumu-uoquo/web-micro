import DfsAPI, { UploadFileDto, UploadFileParam } from "@/api/dfs";

// MIME类型到文件扩展名的映射字典
const mimeTypeExtensions: Record<string, string> = {
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
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "audio/webm": "weba",
  "video/mp4": "mp4",
  "video/mpeg": "mpeg",
  "video/ogg": "ogv",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
  "application/x-tar": "tar",
  "application/gzip": "gz",
  "application/octet-stream": "bin",
  "text/html": "html",
  "text/css": "css",
  "application/javascript": "js",
  "application/wasm": "wasm",
};

const mainTypePrefixes: Record<string, string> = {
  application: "file",
  text: "document",
  image: "image",
  audio: "audio",
  video: "video",
  font: "font",
};

/**
 * 文件工具类（app-platform 本地版本，依赖本地 DfsAPI）
 */
const FileUtil = {
  /**
   * 上传BASE64字符串文件
   */
  async upload(
    file: File,
    param: UploadFileParam,
    onProgress?: (progress: number) => void
  ): Promise<UploadFileDto> {
    if (file.size > 1024 * 1024 * 5) {
      return Promise.reject(new Error("文件大小不能超过5M"));
    }
    onProgress?.(2);
    const base64 = await this.file2Base64(file).catch((e) => Promise.reject(e));
    onProgress?.(10);
    param = Object.assign({ fileName: file.name, finalFile: false }, param);
    param.fileContent = base64;
    return DfsAPI.uploadByBase64(param, {
      onUploadProgress: (event) => {
        if (!onProgress) return;
        let progress = event.progress;
        if (!progress) {
          const total = event.total || (file.size * 4) / 3;
          progress = Math.round(event.loaded / total);
        }
        if (progress >= 1) progress = 0.85;
        onProgress(Math.round(progress * 100));
      },
    }).catch((e) => Promise.reject(e));
  },

  /**
   * 文件上传：分块传输（不支持多线程）
   */
  async uploadByChunk(file: File, options: UploadConfigParam): Promise<string> {
    if (!options || !options.uploadCode) {
      return Promise.reject(new Error("请传入上传配置信息"));
    }
    options = Object.assign(
      { chunkList: [], chunkSize: 1024 * 1024 * 5, onProgress: (p: number) => console.log(p) },
      options
    );
    if (!options.chunkList || options.chunkList.length === 0) {
      const totalChunks = Math.ceil(file.size / options.chunkSize);
      for (let i = 0; i < totalChunks; i++) options.chunkList.push(i);
    }
    let successChunks = 0;
    for (const idx of options.chunkList) {
      const start = idx * options.chunkSize;
      const end = Math.min(file.size, start + options.chunkSize);
      const chunk = file.slice(start, end);
      await DfsAPI.uploadByChunk(chunk, {
        uploadCode: options.uploadCode,
        chunkIndex: idx,
        chunkSize: end - start,
      })
        .then(() => {
          const percent = Math.floor((++successChunks / options.chunkList.length) * 100);
          options.onProgress(percent);
        })
        .catch((e) => Promise.reject(e));
    }
    return Promise.resolve("上传完成");
  },

  file2Base64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  blob2Base64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  base64ToBlob(base64: string, mimeType: string = ""): Blob {
    const pureBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const byteCharacters = atob(pureBase64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  },

  isPicture(mimeType: string, fileName: string): boolean {
    if (mimeType) return mimeType.startsWith("image/");
    const suffix = this.getSuffix(fileName);
    if (!suffix) return false;
    return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tiff", "ico", "heic", "heif"].includes(suffix);
  },

  getSuffix(fileName: string): string {
    if (!fileName || typeof fileName !== "string") return "";
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return "";
    return fileName.slice(lastDotIndex + 1).toLowerCase();
  },

  parseFileNameByDisposition(contentDisposition: string): string {
    if (!contentDisposition) return "";
    try {
      const rfc5987Match = contentDisposition.match(/filename\*=(?:UTF-8|utf-8)''([^;]+)/i);
      if (rfc5987Match?.[1]) return decodeURIComponent(rfc5987Match[1]);
      const filenameMatch = contentDisposition.match(/filename=["']?([^;"']+)["']?/i);
      if (filenameMatch?.[1]) {
        const filename = filenameMatch[1].trim();
        if (filename.includes("%")) {
          try { return decodeURIComponent(filename); } catch { return filename; }
        }
        return filename;
      }
      return "";
    } catch (error) {
      console.error("解析Content-Disposition失败:", error);
      return "";
    }
  },

  generateFileNameByContentType(contentType: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
    if (!contentType) return `download_${timestamp}.bin`;
    const cleanType = contentType.split(";")[0].trim();
    const [mainType, subType] = cleanType.split("/");
    let extension = mimeTypeExtensions[cleanType] || mimeTypeExtensions[`${mainType}/${subType}`] || subType || "bin";
    if (extension.length > 10) extension = "dat";
    const prefix = mainTypePrefixes[mainType] || "download";
    return `${prefix}_${timestamp}.${extension}`;
  },
};

export default FileUtil;

export interface UploadConfigParam {
  uploadCode: string;
  chunkList: number[];
  chunkSize: number;
  retryAttempts?: number;
  onProgress: (percent: number) => void;
}
