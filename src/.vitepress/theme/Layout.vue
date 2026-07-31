<script setup>
import DefaultTheme from 'vitepress/theme'
import EntranceLoading from './components/EntranceLoading.vue'

const Layout = DefaultTheme.Layout
</script>

<template>
  <!-- 入场动画：进入站点时播放一次，加载完成后幕布滑出 -->
  <EntranceLoading />
  <Layout />
</template>
