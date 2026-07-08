import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 分布式文件管理
 */
const DfsAPI = {
  /**
   * 文件清理：清理指定的临时文件
   * @param data 入参:小文件上传完成
   */
  clearTempFile(data: UploadFinishBase64Param, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/file/upload/clear/temp`, {
      data,
      ...config,
    });
  },

  /**
   * 文件下载：分块传输
   * @param param 下载码
   */
  downloadFileByRange(param: DownloadFileByRangeParam, config?: AxiosRequestConfig) {
    return http.request<any>("get", `${USER_BASE_URL}/v1/file/download/transfer?downloadCode=${param.downloadCode}`, {
      ...config,
      responseType: "blob",
    });
  },

  /**
   * 文件上传：小文件（BASE64）
   * @param data 入参:获取上传配置信息
   */
  uploadByBase64(data: UploadFileParam, config?: AxiosRequestConfig) {
    return http.request<UploadFileDto>("post", `${USER_BASE_URL}/v1/file/upload/base64`, {
      data,
      ...config,
    });
  },

  /**
   * 文件上传：分块传输（不支持多线程）
   * @param data 当前块数据
   * @param param 当前块数据
   */
  uploadByChunk(data: Blob, param: UploadByChunkParam, config?: AxiosRequestConfig) {
    return http.request<number>("post", `${USER_BASE_URL}/v1/file/upload/transfer?uploadCode=${param.uploadCode}&chunkIndex=${param.chunkIndex}&chunkSize=${param.chunkSize}`, {
      data,
      ...config,
    });
  },
};

export default DfsAPI;

/**
 * 下载码
 */
export interface DownloadFileByRangeParam {
  /** 下载码 */
  downloadCode?: string;
}

/**
 * 入参：分块传输
 */
export interface UploadByChunkParam {
  /** 当前块序号（从0开始） */
  chunkIndex?: number;
  /** 当前块大小（byte） */
  chunkSize?: number;
  /** 上传码 */
  uploadCode?: string;
}

/**
 * 出参：上传配置信息
 */
export interface UploadConfigDto {
  /** 未完成的块列表（从0开始） */
  chunkList?: number[];
  /** 分块大小（byte） */
  chunkSize?: number;
  /** 上传码 */
  uploadCode?: string;
}

/**
 * 出参:文件保存结果
 */
export interface UploadFileDto {
  /** 文件MD5 */
  fileMd5?: string;
  /** 文件名称（上传时的文件名） */
  fileName: string;
  /** 文件相对路径（含文件名） */
  filePath: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件类型 */
  fileType?: string;
  /** ID */
  id?: string;
  /** 文件显示路径（含文件名） */
  showPath: string;
  /** 临时码 */
  uploadCode?: string;
}

/**
 * 入参:获取上传配置信息
 */
export interface UploadFileParam {
  /** 业务ID */
  businessId?: string;
  /** 文件内容（Base64） */
  fileContent: string;
  /** 文件MD5 */
  fileMd5?: string;
  /** 文件名称 */
  fileName?: string;
  /** 文件相对路径（包含文件名） */
  filePath?: string;
  /** 是否最终文件 */
  finalFile?: boolean;
}

/**
 * 入参:小文件上传完成
 */
export interface UploadFinishBase64Param {
  /** 文件保存的目标路径（包含文件名） */
  filePath?: string;
  /** 临时上传码（分块上传场景必传） */
  uploadCodes: string[];
  /** 是否压缩 */
  zipEnable?: boolean;
}
