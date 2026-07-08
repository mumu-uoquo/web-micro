<template>
  <div ref="iconSelectRef" :style="{ width: props.width, display: 'inline-flex' }">
    <el-popover :visible="popoverVisible" :width="props.popoverWidth" :placement="props.placement">
      <template #reference>
        <div style="display: inline-flex" @click="popoverVisible = !popoverVisible">
          <slot>
            <!-- 模式1：仅图标 -->
            <template v-if="props.type === 'icon'">
              <MenuIcon :icon="selectedIcon" style="width: 14px; height: 14px" />
            </template>
            <!-- 模式2：输入框 -->
            <el-input
              v-else
              v-model="selectedIcon"
              readonly
              placeholder="点击选择图标"
              class="reference"
            >
              <template #prepend>
                <MenuIcon :icon="selectedIcon" style="width: 14px; height: 14px" />
              </template>
              <template #suffix>
                <!-- 清空按钮 -->
                <el-icon
                  v-if="selectedIcon"
                  style="margin-right: 8px"
                  @click.stop="clearSelectedIcon"
                >
                  <CircleClose />
                </el-icon>

                <el-icon
                  :style="{
                    transform: popoverVisible ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform .5s',
                  }"
                >
                  <ArrowDown @click.stop="togglePopover" />
                </el-icon>
              </template>
            </el-input>
          </slot>
        </div>
      </template>

      <!-- 图标选择弹窗 -->
      <div ref="popoverContentRef">
        <el-input v-model="filterText" placeholder="搜索图标" clearable @input="filterIcons" />
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="SVG 图标" name="svg">
            <el-scrollbar height="300px">
              <ul class="icon-grid">
                <li
                  v-for="icon in filteredSvgIcons"
                  :key="'svg-' + icon"
                  class="icon-grid-item"
                  @click="selectIcon(icon)"
                >
                  <el-tooltip :content="icon" placement="bottom" effect="light">
                    <div :class="`i-svg:${icon}`" />
                  </el-tooltip>
                </li>
              </ul>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="Element 图标" name="element">
            <el-scrollbar height="300px">
              <ul class="icon-grid">
                <li
                  v-for="icon in filteredElementIcons"
                  :key="icon"
                  class="icon-grid-item"
                  @click="selectIcon(icon)"
                >
                  <el-icon>
                    <component :is="icon" />
                  </el-icon>
                </li>
              </ul>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import MenuIcon from "@/components/MenuIcon/index.vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  // 图标显示框宽度
  width: {
    type: String,
    default: "500px",
  },
  // 图标选择框宽度
  popoverWidth: {
    type: String,
    default: "500px",
  },
  // 图标选择类型
  type: {
    type: String as PropType<"input" | "icon">,
    default: "input",
  },
  placement: {
    type: String as PropType<
      | "top"
      | "top-start"
      | "top-end"
      | "bottom"
      | "bottom-start"
      | "bottom-end"
      | "left"
      | "left-start"
      | "left-end"
      | "right"
      | "right-start"
      | "right-end"
    >,
    default: "bottom-end",
  },
});

const emit = defineEmits(["update:modelValue"]);

const selectedIcon = defineModel("modelValue", {
  type: String,
  required: true,
  default: "",
});

const svgIcons = ref<string[]>([]);
const elementIcons = ref<string[]>(Object.keys(ElementPlusIconsVue));

const popoverVisible = ref(false);
const activeTab = ref("svg");
const filterText = ref("");
const filteredSvgIcons = ref<string[]>([]);
const filteredElementIcons = ref<string[]>(elementIcons.value);

function handleTabClick(tabPane: any) {
  activeTab.value = tabPane.props.name;
  filterIcons();
}

function filterIcons() {
  if (activeTab.value === "svg") {
    filteredSvgIcons.value = filterText.value
      ? svgIcons.value.filter((icon) => icon.toLowerCase().includes(filterText.value.toLowerCase()))
      : svgIcons.value;
  } else {
    filteredElementIcons.value = filterText.value
      ? elementIcons.value.filter((icon) =>
          icon.toLowerCase().includes(filterText.value.toLowerCase())
        )
      : elementIcons.value;
  }
}

function selectIcon(icon: string) {
  const iconName = activeTab.value === "element" ? "el-icon-" + icon : icon;
  emit("update:modelValue", iconName);
  popoverVisible.value = false;
}

function clearSelectedIcon() {
  selectedIcon.value = "";
}

function togglePopover() {
  popoverVisible.value = !popoverVisible.value;
  if (popoverVisible.value) {
    filterText.value = "";
    filterIcons();
  }
}

const iconSelectRef = ref();
const popoverContentRef = ref();

onClickOutside(iconSelectRef, () => (popoverVisible.value = false), {
  ignore: [popoverContentRef],
});

function loadIcons() {
  const icons = import.meta.glob("/src/assets/icons/**/*.svg");
  const base = "/src/assets/icons/";
  for (const filePath in icons) {
    const relative = filePath.slice(base.length);
    const iconName = relative.replace(/\.svg$/, "").replaceAll("/", "-");
    svgIcons.value.push(iconName);
  }
  filteredSvgIcons.value = svgIcons.value;
}

onMounted(() => {
  loadIcons();
  if (selectedIcon.value) {
    if (elementIcons.value.includes(selectedIcon.value.replace("el-icon-", ""))) {
      activeTab.value = "element";
    } else {
      activeTab.value = "svg";
    }
  }
});

defineExpose({
  togglePopover,
});
</script>

<style scoped lang="scss">
.reference :deep(.el-input__wrapper),
.reference :deep(.el-input__inner) {
  cursor: pointer;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
}

.icon-grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.icon-grid-item:hover {
  border-color: var(--el-color-primary);
  transform: scale(1.2);
}
</style>
