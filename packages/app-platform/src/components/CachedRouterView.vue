<template>
  <RouterView v-slot="{ Component, route }">
    <KeepAlive :include="cachedViewKeys">
      <component :is="getCachedComponent(Component, route.path)" :key="route.path" />
    </KeepAlive>
  </RouterView>
</template>

<script setup lang="ts">
import { h, type Component } from "vue";
import { RouterView } from "vue-router";
import { cachedViewKeys } from "@/router/cache";

const wrapperMap = new Map<string, Component>();

function getCachedComponent(component: Component, path: string): Component | undefined {
  if (!component) return;

  let wrapper = wrapperMap.get(path);
  if (!wrapper) {
    wrapper = {
      name: path,
      render: () => h(component, { key: path }),
    };
    wrapperMap.set(path, wrapper);
  }

  return wrapper;
}
</script>
