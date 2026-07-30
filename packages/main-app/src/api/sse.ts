import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 消息订阅
 */
const SseAPI = {
  /**
   * 用户消息：获取验证码
   */
  getEndpointCode(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/sse/endpoint`, {
      ...config,
    });
  },
};

export default SseAPI;
