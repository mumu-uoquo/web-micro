<!--
 * 基于 wangEditor-next 的富文本编辑器组件二次封装
-->

<template>
  <div style="z-index: 999; border: 1px solid var(--el-border-color)">
    <Toolbar
      v-if="editorRef"
      :key="editorKey"
      :editor="editorRef"
      :mode="mod"
      :default-config="toolbarConfig"
      style="border-bottom: 1px solid var(--el-border-color)"
    />
    <Editor
      :key="editorKey"
      v-model="modelValue"
      :style="{ height: height, overflowY: 'hidden' }"
      :default-config="editorConfig"
      :mode="mod"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import "@wangeditor-next/editor/dist/css/style.css";
import { Toolbar, Editor } from "@wangeditor-next/editor-for-vue";
import { IToolbarConfig, IEditorConfig, SlateElement } from "@wangeditor-next/editor";

import DfsAPI, { UploadFileDto } from "@/api/dfs";
import FileUtil from "@/utils/file";

type InsertFnType = (_url: string, _alt: string, _href: string) => void;
type ImageElement = SlateElement & {
  src: string; alt: string; url: string; href: string;
};

let uploadImages: UploadFileDto[] = [];
const props = defineProps({
  height: { type: String, default: "500px" },
  mod: { type: String, default: "simple" },
  placeholder: { type: String, default: "请输入内容..." },
});
const modelValue = defineModel<string>({ type: String, required: false, default: "" });

const simpleToolbarConfig = ref<Partial<IToolbarConfig>>({
  toolbarKeys: [
    "blockquote", "headerSelect", "|", "bold", "italic", "color", "clearStyle", "|",
    "bulletedList", "numberedList",
    { key: "group-justify", title: "对齐", menuKeys: ["justifyLeft", "justifyRight", "justifyCenter", "justifyJustify"] },
    "|", "uploadImage", "insertTable", "codeBlock", "|", "undo", "redo", "|", "fullScreen",
  ],
});
const standardToolbarConfig = ref<Partial<IToolbarConfig>>({
  toolbarKeys: [
    "headerSelect", "blockquote", "codeBlock", "|",
    "bold", "italic", "underline", "through", "fontSize", "fontFamily", "color", "bgColor", "|",
    "bulletedList", "numberedList", "delIndent", "indent", "lineHeight",
    "insertLink", "insertImage", "uploadImage", "deleteImage", "insertTable", "|",
    "divider", "justifyCenter", "justifyJustify", "justifyLeft", "justifyRight",
    "undo", "redo", "clearStyle", "fullScreen",
  ],
});
const toolbarConfig = ref<Partial<IToolbarConfig>>({});

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      maxFileSize: 2 * 1024 * 1024,
      maxNumberOfFiles: 10,
      base64LimitSize: 5 * 1024,
      customUpload(file: File, insertFn: InsertFnType) {
        FileUtil.upload(file, { fileName: file.name, fileContent: "", finalFile: true }).then((res) => {
          insertFn(res.showPath, file.name, res.filePath);
          uploadImages.push(res);
        });
      },
    } as any,
    insertImage: {
      onInsertedImage(imageNode: ImageElement | null) {
        if (imageNode == null) return;
        const { src, alt, url, href } = imageNode;
        console.log("inserted image", src, alt, url, href);
      },
    },
  },
};

const editorRef = shallowRef();
const editorKey = ref(0);
const innerUpdating = ref(false);

const handleCreated = (editor: any) => { editorRef.value = editor; };
const handleChange = () => {
  innerUpdating.value = true;
  Promise.resolve().then(() => { innerUpdating.value = false; });
};

const clearContent = () => { editorRef.value.clear(); };

const clearAllFile = () => {
  const clearUploadCodes = uploadImages.map((item) => item.uploadCode || "");
  if (clearUploadCodes.length === 0) return;
  DfsAPI.clearTempFile({ uploadCodes: clearUploadCodes })
    .then(() => { uploadImages = []; })
    .catch((err) => { console.log("clearAllFile", err); });
};

const clearNotUseFile = () => {
  const editorImageList: string[] = [];
  const imageList = editorRef.value.getElemsByType("image");
  imageList.forEach((item: any) => { editorImageList.push(item.src); });
  const clearUploadCodes = uploadImages.filter((item) => !editorImageList.includes(item.filePath)).map((item) => item.uploadCode || "");
  if (clearUploadCodes.length === 0) return;
  DfsAPI.clearTempFile({ uploadCodes: clearUploadCodes })
    .then(() => { uploadImages = uploadImages.filter((item) => !clearUploadCodes.includes(item.uploadCode || "")); })
    .catch((err) => { console.log("clearNotUseFile", err); });
};

watch(
  () => modelValue.value,
  () => {
    if (innerUpdating.value) return;
    editorRef.value = null;
    editorKey.value += 1;
    if (props.mod === "simple") toolbarConfig.value = simpleToolbarConfig.value;
    else if (props.mod === "standard") toolbarConfig.value = standardToolbarConfig.value;
    else toolbarConfig.value = {};
  },
  { immediate: true }
);

onMounted(() => { uploadImages = []; });
defineExpose({ clearContent, clearAllFile, clearNotUseFile });

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>
