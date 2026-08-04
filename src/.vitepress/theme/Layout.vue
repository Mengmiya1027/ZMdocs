<script setup>
import DefaultTheme from 'vitepress/theme'
import EntranceLoading from './components/EntranceLoading.vue'
import BGMusic from "./components/BGMusic.vue";
import CustomScrollbar from './components/CustomScrollbar.vue'

const Layout = DefaultTheme.Layout
</script>

<template>
  <!-- 入场动画：进入站点时播放一次，加载完成后幕布滑出 -->
  <EntranceLoading />
  <BGMusic />
  <Layout />
  <!-- 玻璃浮动滚动条：全局隐藏原生滚动条后接管视觉与拖拽 -->
  <CustomScrollbar />
</template>