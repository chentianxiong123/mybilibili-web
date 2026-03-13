<script setup>
// 无布局 - 页面完全自主控制
</script>

<template>
  <div class="layout-none">
    <slot />
  </div>
</template>

<style scoped>
.layout-none {
  min-height: 100vh;
}
</style>
