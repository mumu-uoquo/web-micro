import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type Method,
} from "axios";

import { ResultEnum } from "../enums/result.enum";

import FileUtil from "./file";
import { AuthStorage, redirectToLogin } from "./auth";
import { guid } from "./common";
import { encrypt } from "./crypto";
import { STORAGE_KEYS } from "../constants";

/**
 * UserStore 的依赖接口——通过构造函数注入，避免直接依赖 Pinia 实例
 */
export interface UserStoreAdapter {
  /** 执行 token 刷新，返回新的 token 信息 */
  refreshToken(): Promise<{ accessToken: string; expireTime?: number }>;
}

interface OriginalRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/**
 * 生成签名相关信息
 */
export function generateSignature(param?: Record<string, any>, body?: any): Record<string, string> {
  const nonce = guid();
  const token = AuthStorage.getAccessToken();
  const appid = AuthStorage.getAppkey();
  const secret = AuthStorage.getSecret();
  const device = AuthStorage.getDevcieId();
  // 从 localStorage 读取用户选择的语言，未设置时降级为 zh-CN
  const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE) ?? "zh-CN";
  const time = new Date().getTime() + "";
  const prefix = appid + token + language + nonce + device + time;
  // 参数处理：将 query params 按 key 字典序排序后，顺次拼接 key 和 value
  // 例如：{ b: "2", a: "1" } → "a1b2"
  // value 为 null / undefined 时以空字符串参与拼接
  let paramStr = "";
  if (param && typeof param === "object") {
    paramStr = Object.keys(param)
      .sort()
      .map((k) => `${k}${param[k] ?? ""}`)
      .join("");
  }
  // 消息体处理：保持原始字段顺序序列化
  let bodyStr = "";
  if (body) {
    if (typeof body === "string") {
      bodyStr = body;
    } else {
      bodyStr = JSON.stringify(body);
    }
  }
  const signature = encrypt.md5(prefix + paramStr + bodyStr + secret);

  return {
    token,
    nonce,
    appid,
    timestamp: time,
    "device-id": device,
    "user-language": language,
    "signature-app": signature,
  };
}

class AxiosWithTokenRefresh {
  private baseConfig: AxiosRequestConfig;

  // axios 实例
  private instance: AxiosInstance;

  // 注入的 userStore 适配器
  private userStore: UserStoreAdapter;

  // 可选的消息提示回调（默认使用 console.error）
  private messageHandler: (message: string) => void;

  // 请求队列（用于 token 刷新期间的请求）
  private requestQueue: OriginalRequest[];
  private isRefreshing: boolean;
  private refreshTimer: any;
  private refreshPromise: Promise<any> | null; // 存储刷新 token 的 Promise

  constructor(config: AxiosRequestConfig = {}, userStore: UserStoreAdapter, messageHandler?: (message: string) => void) {
    this.userStore = userStore;
    this.messageHandler = messageHandler || ((msg: string) => console.error(msg || "系统出错"));

    // 基础配置
    // 优先级：外部传入 > 生产环境直连（VITE_APP_API_URL）> 同域转发（VITE_APP_BASE_API，由 Nginx 代理）
    const isProd = typeof process !== "undefined" && process.env?.NODE_ENV === "production";
    const apiUrl = typeof process !== "undefined" ? process.env?.VITE_APP_API_URL : undefined;
    const baseApi = typeof process !== "undefined" ? process.env?.VITE_APP_BASE_API : undefined;
    const baseURL = config.baseURL || (isProd && apiUrl ? apiUrl : baseApi);
    this.baseConfig = {
      baseURL,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // 创建 axios 实例
    this.instance = axios.create(this.baseConfig);

    // 请求队列（用于 token 刷新期间的请求）
    this.requestQueue = [];
    this.isRefreshing = false;
    this.refreshTimer = null;
    this.refreshPromise = null;

    // 初始化拦截器
    this.httpRequestInterceptors();
    this.httpResponseInterceptors();
  }

  /**
   * 打印调试日志
   */
  private _debug(title: string, logid: string, url: string | undefined, data: any = null) {
    console.log(Date.now(), title, logid, url, data);
  }

  /**
   * 生成请求签名
   */
  private setSignHeader(config: InternalAxiosRequestConfig) {
    const signHeader = generateSignature(config.params, config.data);
    const token = signHeader["token"];
    // 自定义请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["token"] = token;
    }
    config.headers["appid"] = signHeader["appid"];
    config.headers["nonce"] = signHeader["nonce"];
    config.headers["device-id"] = signHeader["device-id"];
    config.headers["timestamp"] = signHeader["timestamp"];
    config.headers["user-language"] = signHeader["user-language"];
    config.headers["signature-app"] = signHeader["signature-app"];
  }

  /**
   * 刷新 token
   */
  async refreshAccessToken() {
    // 如果已经在刷新，返回同一个 Promise
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    // 开始刷新token
    this.isRefreshing = true;
    this.refreshPromise = new Promise((resolve, reject) => {
      console.log("刷新 Access Token 开始");
      this.userStore
        .refreshToken()
        .then((token) => {
          console.log("刷新 Access Token 完成");
          // 设置自动刷新
          if (token.expireTime) {
            this.setupTokenAutoRefresh(token.expireTime);
          }
          // 释放资源
          this.isRefreshing = false;
          this.refreshPromise = null;
          // 处理队列中的请求
          this.processRequestQueue();
          resolve(token);
        })
        .catch((error: any) => {
          console.error("刷新 Access Token 失败", error);
          // 释放资源
          this.isRefreshing = false;
          this.refreshPromise = null;
          // 拒绝所有等待的请求，并重新登录
          this.rejectAllRequests(error);
          redirectToLogin();
          // 已经重定向到登录，所以不需要再冒泡处理异常
          // reject(error);
        });
    });

    return this.refreshPromise;
  }

  /**
   * 添加到请求队列
   */
  addToRequestQueue(config: InternalAxiosRequestConfig) {
    return new Promise<void>((resolve, reject) => {
      this._debug("请求等待：", config.headers?.logid, config.url, config.data);
      this.requestQueue.push({ config, resolve, reject });
    });
  }

  /**
   * 处理请求队列
   */
  processRequestQueue() {
    while (this.requestQueue.length > 0) {
      const request: any = this.requestQueue.shift();
      this._debug(
        "请求继续：",
        request.config.headers?.logid,
        request.config.url,
        request.config.data
      );
      this.setSignHeader(request.config);
      if (request.config._retry) {
        request.resolve(this.instance(request.config));
      } else {
        request.resolve(request.config);
      }
    }
  }

  /**
   * 拒绝所有等待的请求
   */
  rejectAllRequests(error: any) {
    console.log(`拒绝所有等待的请求，共 ${this.requestQueue.length} 个`);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    while (this.requestQueue.length > 0) {
      const request: any = this.requestQueue.shift();
      this._debug(
        "请求取消：",
        request.config.headers?.logid,
        request.config.url,
        request.config.data
      );
      // 已经在 refreshAccessToken 重定向到登录页了，所以此处也不需要触发原接口调用处的异常处理
      // request.reject(error);
    }
  }

  /**
   * 设置 token 自动刷新
   */
  setupTokenAutoRefresh(expiresIn: number) {
    // 在 token 过期前 1 分钟刷新
    const refreshTime = (expiresIn - 60) * 1000;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, refreshTime);
  }

  /**
   * 判断是否跳过队列
   */
  private checkSkipQueue(config: InternalAxiosRequestConfig): boolean {
    if (config._skipQueue) {
      return true;
    }
    const whiteList = ["/login", "/token/refresh", "/auth/captcha"];
    return whiteList.some((url) => config.url?.endsWith(url));
  }

  /**
   * 请求拦截器
   */
  private httpRequestInterceptors() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig): Promise<any> => {
        // 用于日志追踪
        if (!config.headers.logid) {
          config.headers["logid"] = Date.now();
        }
        // 1. 如果正在重新获取token，则直接加入等待队列
        if (this.isRefreshing && !this.checkSkipQueue(config)) {
          // 将请求加入队列并返回一个特殊的 Promise
          // 这样可以让请求暂停，直到 token 刷新完成
          return this.addToRequestQueue(config);
        }
        // 2. 正常请求，添加签名
        this.setSignHeader(config);
        this._debug("请求开始：", config.headers?.logid, config.url, config.data);
        return Promise.resolve(config);
      },
      (error) => {
        this._debug("请求失败：", error.config?.headers?.logid, error.config?.url, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 响应拦截器
   */
  private httpResponseInterceptors() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 1. 文件下载（需在调用的地方传入指定参数：responseType: "blob"）
        if (
          response.config.responseType === "blob" ||
          response.config.responseType === "arraybuffer"
        ) {
          // 若响应头中无异常码，则下载文件，否则继续执行按JSON处理内容
          const status = response.headers["response-code"];
          if (!status) {
            return this.handleDownload(response);
          }
        }
        // 2. 普通JSON响应处理
        this._debug(
          "响应内容：",
          response.config?.headers?.logid,
          response.config?.url,
          response.data
        );
        const originalRequest = response.config;
        const { status, data, message } = response.data;
        if (status === ResultEnum.SUCCESS) {
          // 2.1 成功响应的数据处理
          // 如果是PageResult，则需要将 total 转换为 number（后台会将Long转为字符串输出）
          if (
            data &&
            Object.prototype.hasOwnProperty.call(data, "pageNum") &&
            Object.prototype.hasOwnProperty.call(data, "pageSize")
          ) {
            data.pageNum = Number(data.pageNum);
            data.pageSize = Number(data.pageSize);
            data.size = Number(data.size);
            data.total = Number(data.total);
          }
          return data;
        } else if (status === ResultEnum.TOKEN_INVALID && !originalRequest._retry) {
          // 2.2 token 失效的处理
          originalRequest._retry = true; // 标记为已重试
          // 如果正在刷新 token，将请求加入队列
          if (this.isRefreshing) {
            return this.addToRequestQueue(originalRequest);
          }
          // 刷新 token（refreshAccessToken 内部已处理 rejectAllRequests 和 redirectToLogin）
          this.refreshAccessToken().catch(() => {});
          // 放入重试队列
          return this.addToRequestQueue(originalRequest);
        } else if (
          status === ResultEnum.TOKEN_KICK_OUT ||
          status === ResultEnum.PARAM_SIGN_EMPTY ||
          status === ResultEnum.TOKEN_EMPTY
        ) {
          // 2.3 特定异常需跳转登录
          this._debug(
            "成功响应，需跳转登录页",
            response.config?.headers?.logid,
            response.config?.url
          );
          redirectToLogin();
          // return Promise.reject(new Error(message || "Error"));
        } else if (response.config?.silent) {
          // 2.4 交由由调用方处理错误
          return Promise.reject(message);
        } else {
          // 2.4 其他异常统一提示
          this.$message(message);
          // 20260517：还需抛出异常打断调用方的执行
          return Promise.reject(message);
        }
      },
      (error) => {
        this._debug("响应失败：", error.config?.headers?.logid, error.config?.url, error.message);
        // 异常处理 非 2xx 状态码 会进入这里
        const originalRequest = error.config;
        // 1. 如果已经重试，则直接返回错误
        if (originalRequest?._retry) {
          return Promise.reject(error);
        }
        if (error.response?.data) {
          const { status, message } = error.response.data;
          // 2. 如果 token 无效，则刷新 token
          if (status === ResultEnum.TOKEN_INVALID) {
            originalRequest._retry = true; // 标记为已重试
            // 如果正在刷新 token，将请求加入队列
            if (this.isRefreshing) {
              return this.addToRequestQueue(originalRequest);
            }
            // 刷新 token（refreshAccessToken 内部已处理 rejectAllRequests 和 redirectToLogin）
            this.refreshAccessToken().catch(() => {});
            // 放入重试队列
            return this.addToRequestQueue(originalRequest);
          } else if (
            status === ResultEnum.TOKEN_KICK_OUT ||
            status === ResultEnum.PARAM_SIGN_EMPTY ||
            status === ResultEnum.TOKEN_EMPTY
          ) {
            // 3. 特定异常需跳转登录
            this._debug(
              "失败响应，跳转登录页",
              error.response.config?.headers?.logid,
              error.response.config?.url
            );
            redirectToLogin();
            // return Promise.reject(error);
            return;
          } else if (error.response.config?.silent) {
            // 4. 交由调用方处理错误
            return Promise.reject(message);
          } else {
            // 5. 其他异常统一提示
            this.$message(message);
            // 20260517：还需抛出异常打断调用方的执行
            return Promise.reject(message);
          }
        } else {
          // 没有响应体时，直接交由调用方处理
          return Promise.reject(error);
        }
      }
    );
  }

  /**
   * 信息显示
   */
  private $message(message: string) {
    this.messageHandler(message || "系统出错");
  }

  /**
   * 处理文件下载
   */
  private handleDownload(response: AxiosResponse) {
    // 从响应头获取文件名
    let filename = FileUtil.parseFileNameByDisposition(
      (response.headers["content-disposition"] as string) ?? ""
    );
    if (!filename) {
      filename = FileUtil.generateFileNameByContentType(
        (response.headers["content-type"] as string) ?? ""
      );
    }

    // 创建 Blob 对象
    const blob = new Blob([response.data]);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // 清理资源
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // 返回成功消息或原始响应
    return {
      success: true,
      filename,
      message: "文件下载成功",
    };
  }

  /** 通用请求工具函数 */
  public request<V>(method: Method, url: string, config?: AxiosRequestConfig): Promise<V> {
    const axiosConfig = {
      method,
      url,
      ...config,
    } as AxiosRequestConfig;

    return this.instance<any, V>(axiosConfig);
  }

  /** 单独抽离的`post`工具函数 */
  public post<P, V>(url: string, data?: P, config?: AxiosRequestConfig): Promise<V> {
    return this.request<V>("post", url, { data, ...config });
  }

  /** 单独抽离的`get`工具函数 */
  public get<P, V>(url: string, data?: P, config?: AxiosRequestConfig): Promise<V> {
    return this.request<V>("get", url, { data, ...config });
  }
}

/**
 * 工厂函数：创建注入了 userStore 适配器的 HTTP 实例
 *
 * @param config Axios 基础配置
 * @param userStore UserStore 适配器（各应用自行实现 refreshToken）
 * @param messageHandler 可选的消息提示回调（例如 ElMessage；未传时降级为 console.error）
 */
export function createHttpInstance(
  config: AxiosRequestConfig,
  userStore: UserStoreAdapter,
  messageHandler?: (message: string) => void
): AxiosWithTokenRefresh {
  return new AxiosWithTokenRefresh(config, userStore, messageHandler);
}
