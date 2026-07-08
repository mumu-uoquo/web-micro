import { store } from "@/stores";
import SystemAPI, { type SysDictionarySimpleDto } from "@/api/system";
import { STORAGE_KEYS } from "@/constants";

export const useDictStore = defineStore("dict", () => {
  // 字典数据缓存
  const dictionary = useStorage<Record<string, SysDictionarySimpleDto[]>>(
    STORAGE_KEYS.DICT_CACHE,
    {}
  );

  // 请求队列（防止重复请求）
  const requestQueue: Record<string, Promise<void>> = {};

  /**
   * 加载数据字典
   */
  const loadDictionary = async (code: string | null) => {
    if (code && code.length >= 3) {
      await loadDictionaryByCode(code.substring(0, 3));
    } else {
      await loadDictionaryByAll();
    }
  };

  // 加载所有数据
  const loadDictionaryByAll = async () => {
    // 当本地有缓存时，不再远程加载
    if (Object.keys(dictionary.value).length > 0) {
      return;
    }
    const code = "all";
    if (!requestQueue[code]) {
      // 防止重复请求
      dictionary.value = {};
      SystemAPI.listDictionarySimpleByAll().then((data) => {
        data.forEach((item) => {
          dictionary.value[item.dicCode] = item.children || [];
        });
        Reflect.deleteProperty(requestQueue, code);
      });
    }
    await requestQueue[code];
  };

  // 加载指定字典数据
  const loadDictionaryByCode = async (code: string) => {
    if (dictionary.value[code]) {
      return;
    }
    if (!requestQueue[code]) {
      // 防止重复请求
      SystemAPI.listDictionarySimpleByCode({ itemCode: code }).then((data) => {
        dictionary.value[code] = data;
        Reflect.deleteProperty(requestQueue, code);
      });
    }
    await requestQueue[code];
  };

  /**
   * 获取数据字典
   */
  const getDictionary = (code: string): SysDictionarySimpleDto | undefined => {
    let list: SysDictionarySimpleDto[] = [];
    if (code && code.length == 6) {
      list = dictionary.value[code.substring(0, 3)] || [];
    }
    return list.find((item) => item.dicCode == code);
  };

  /**
   * 获取数据字典列表
   */
  const listDictionary = (code: string): SysDictionarySimpleDto[] => {
    let list: SysDictionarySimpleDto[] = [];
    if (code && code.length >= 3) {
      list = dictionary.value[code.substring(0, 3)] || [];
    }
    return list;
  };

  /**
   * 清空字典缓存
   */
  const clearDictionary = () => {
    dictionary.value = {};
  };

  return {
    loadDictionary,
    getDictionary,
    listDictionary,
    clearDictionary,
  };
});

export function useDictStoreHook() {
  return useDictStore(store);
}
