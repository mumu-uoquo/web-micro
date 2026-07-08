/**
 * 页面切换动画枚举
 */
export const enum PageSwitchingAnimationEnum {
  /**
   * 无动画
   */
  NONE = "none",
  /**
   * 淡入淡出
   */
  FADE = "fade",
  /**
   * 平滑切换
   */
  FADE_SLIDE = "fade-slide",
  /**
   * 缩放切换
   */
  FADE_SCALE = "fade-scale",
}
export const PageSwitchingAnimationOptions: Record<string, OptionItem> = {
  none: { value: "none", label: "无动画" },
  fade: { value: "fade", label: "淡入淡出" },
  "fade-slide": { value: "fade-slide", label: "平滑切换" },
  "fade-scale": { value: "fade-scale", label: "缩放切换" },
};
