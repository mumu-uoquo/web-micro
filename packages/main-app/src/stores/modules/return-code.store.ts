import { store } from "@/stores";
import SystemAPI from "@/api/system";
import { STORAGE_KEYS } from "@/constants";

export const useReturnCodeStore = defineStore("returnCode", () => {
  // 响应码数据缓存
  const returnCodeData = useStorage<Record<string, string>>(STORAGE_KEYS.RETURN_CODE_CACHE, {});

  /**
   * 加载响应码
   */
  const loadReturnCode = async () => {
    // 当本地有缓存时，不再远程加载
    if (Object.keys(returnCodeData.value).length > 0) {
      return;
    }
    // 加载响应码
    const data = await SystemAPI.listAllReturnCodes();
    data.forEach((item) => {
      returnCodeData.value[item.returnCode] = item.returnValue || "";
    });
  };

  /**
   * 获取响应码
   */
  const getReturnCode = (code: string): string | undefined => {
    return returnCodeData.value[code];
  };

  /**
   * 清空响应码
   */
  const clearReturnCode = () => {
    returnCodeData.value = {};
  };

  return {
    loadReturnCode,
    getReturnCode,
    clearReturnCode,
  };
});

export function useReturnCodeStoreHook() {
  return useReturnCodeStore(store);
}
