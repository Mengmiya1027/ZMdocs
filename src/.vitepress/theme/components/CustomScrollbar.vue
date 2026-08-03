<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const props = defineProps<{
  /** 要跟踪的滚动容器元素；不传则跟踪 window */
  target?: HTMLElement | null
}>()

const rail = ref<HTMLElement | null>(null)
const thumb = ref<HTMLElement | null>(null)
const visible = ref(false)

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const PROX = 64
const IDLE_HIDE = 1500
const NEAR_HIDE = 300
const RESIZE_HIDE = 150

let viewportH = 0
let scrollH = 0
let navOffset = 0
let trackH = 0
let thumbH = 28
let rafPending = false
let dragging = false
let startY = 0
let startScroll = 0
let hideTimer: number | undefined
let mo: MutationObserver | undefined
let ro: ResizeObserver | undefined
let lastMouseX = 1e9

// ---------- helpers ----------

function isWindowMode() {
  return !props.target
}

function getScrollTop() {
  return props.target ? props.target.scrollTop : window.scrollY
}
function getMaxScroll() {
  return scrollH - viewportH
}

function setScrollTo(v: number) {
  if (props.target) {
    props.target.scrollTop = v
  } else {
    window.scrollTo({ top: v })
  }
}

function getContainerRect(): DOMRect | null {
  if (props.target) {
    return props.target.getBoundingClientRect()
  }
  return null
}

// 鼠标是否靠近滚动条区域
function isNear() {
  if (props.target) {
    const r = getContainerRect()
    if (!r) return false
    return lastMouseX > r.right - PROX && lastMouseX > r.left
  }
  return lastMouseX > window.innerWidth - PROX
}

// ---------- 测量 ----------

function getNavOffset() {
  if (!isWindowMode()) return 0
  const el = document.querySelector('.VPNavBar .container') as HTMLElement | null
  if (!el) return 0
  const r = el.getBoundingClientRect()
  if (r.bottom > 0 && r.bottom < window.innerHeight * 0.6) return r.bottom
  return 0
}

function measure() {
  const target = props.target

  if (target) {
    viewportH = target.clientHeight
    scrollH = target.scrollHeight
    navOffset = 0
    trackH = viewportH
    // absolute 元素在 overflow:auto 容器内会随内容滚动；
    // top = scrollTop 抵消该偏移，使 rail 始终保持在可视区顶部
    if (rail.value) {
      rail.value.style.position = 'absolute'
      rail.value.style.top = target.scrollTop + 'px'
      rail.value.style.right = '0'
      rail.value.style.height = viewportH + 'px'
    }
  } else {
    viewportH = window.innerHeight
    scrollH = document.documentElement.scrollHeight
    navOffset = getNavOffset()
    trackH = viewportH - navOffset
    if (rail.value) {
      rail.value.style.top = navOffset + 'px'
      rail.value.style.right = '0px'
      rail.value.style.height = trackH + 'px'
      rail.value.style.position = 'fixed'
    }
  }

  const ratio = viewportH / scrollH
  thumbH = Math.max(28, Math.min(trackH * ratio, trackH))
  if (thumb.value) thumb.value.style.height = thumbH + 'px'
  position()
  updateRailDisplay()
}

function updateRailDisplay() {
  if (!rail.value) return
  const show = scrollH > viewportH + 2
  rail.value.style.display = show ? 'block' : 'none'
}

// ---------- 定位 thumb ----------

function position() {
  if (!thumb.value) return
  const maxScroll = getMaxScroll()
  const maxTop = trackH - thumbH
  const top = maxScroll > 0 ? (getScrollTop() / maxScroll) * maxTop : 0
  thumb.value.style.top = top + 'px'
}

// ---------- 显隐控制 ----------

function show() {
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
}
function scheduleHide(delay: number) {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    visible.value = false
  }, delay)
}

// ---------- 事件 ----------

function onScroll() {
  if (!rafPending) {
    rafPending = true
    requestAnimationFrame(() => {
      if (props.target) {
        // 容器模式：absolute 元素随内容滚动，top=scrollTop 抵消偏移
        if (rail.value) {
          rail.value.style.top = getScrollTop() + 'px'
        }
      } else if (rail.value) {
        // 窗口模式：同步 navOffset
        const no = getNavOffset()
        if (no !== navOffset) {
          navOffset = no
          trackH = viewportH - navOffset
          rail.value.style.top = navOffset + 'px'
          rail.value.style.height = trackH + 'px'
        }
      }
      position()
      rafPending = false
    })
  }
  show()
  if (isNear()) {
    if (hideTimer) clearTimeout(hideTimer)
  } else {
    scheduleHide(IDLE_HIDE)
  }
}

function onMouseMove(e: MouseEvent) {
  lastMouseX = e.clientX
  if (isNear()) {
    show()
    if (hideTimer) clearTimeout(hideTimer)
  } else {
    scheduleHide(NEAR_HIDE)
  }
}

function onThumbEnter() {
  show()
  if (hideTimer) clearTimeout(hideTimer)
}
function onThumbLeave() {
  scheduleHide(NEAR_HIDE)
}

function onThumbDown(e: PointerEvent) {
  dragging = true
  startY = e.clientY
  startScroll = getScrollTop()
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  document.body.style.userSelect = 'none'
  show()
  if (hideTimer) clearTimeout(hideTimer)
}
function onThumbMove(e: PointerEvent) {
  if (!dragging) return
  const maxScroll = getMaxScroll()
  const maxTop = trackH - thumbH
  const delta = e.clientY - startY
  const ratio = maxTop > 0 ? delta / maxTop : 0
  const newScroll = startScroll + ratio * maxScroll
  setScrollTo(newScroll)
  // 同步更新 rail 和 thumb：onScroll 走 rAF 有延迟，拖拽时直接写
  if (rail.value && props.target) {
    rail.value.style.top = newScroll + 'px'
  }
  if (thumb.value) {
    const top = maxScroll > 0 ? (newScroll / maxScroll) * maxTop : 0
    thumb.value.style.top = Math.max(0, Math.min(maxTop, top)) + 'px'
  }
}
function onThumbUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  document.body.style.userSelect = ''
  ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
}

function onResize() {
  measure()
  if (dragging) return
  scheduleHide(RESIZE_HIDE)
}

// ---------- 生命周期 ----------

const route = useRoute()
watch(
  () => route.path,
  () => nextTick(() => setTimeout(measure, 80))
)

// target 可能延迟就绪（如 v-if 容器），watch 确保就绪后正确初始化
watch(
  () => props.target,
  (t, old) => {
    // 清理旧 target 的 listener
    if (old) {
      old.removeEventListener('scroll', onScroll)
      ro?.disconnect()
    }
    if (t) {
      nextTick(() => measure())
      t.addEventListener('scroll', onScroll, { passive: true })
      ro = new ResizeObserver(() => measure())
      ro.observe(t)
    }
  }
)

onMounted(() => {
  // target 为 undefined 才是真正的窗口模式（没传 prop）
  // target 为 null 是 ref 还没就绪，等 watch 处理
  if (props.target === undefined) {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('load', measure)
    measure()
  } else if (props.target) {
    // ref 已就绪，直接设置
    const t = props.target
    t.addEventListener('scroll', onScroll, { passive: true })
    ro = new ResizeObserver(() => measure())
    ro.observe(t)
    measure()
  }
  // props.target === null → 等 watch 触发

  window.addEventListener('mousemove', onMouseMove, { passive: true })

  mo = new MutationObserver(() => {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = window.setTimeout(measure, 150)
  })
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })
})

onBeforeUnmount(() => {
  const target = props.target
  if (target) {
    target.removeEventListener('scroll', onScroll)
    ro?.disconnect()
  } else if (target === undefined) {
    // 仅在窗口模式（没传 prop）时清理 window 监听
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('load', measure)
  }
  window.removeEventListener('mousemove', onMouseMove)
  if (hideTimer) clearTimeout(hideTimer)
  mo?.disconnect()
})
</script>

<template>
  <div
    ref="rail"
    class="zm-scroll"
    :class="{ 'is-visible': visible, 'reduce-motion': reduceMotion }"
  >
    <div
      ref="thumb"
      class="zm-scroll-thumb"
      @pointerdown.stop="onThumbDown"
      @pointermove="onThumbMove"
      @pointerup="onThumbUp"
      @pointercancel="onThumbUp"
      @mouseenter="onThumbEnter"
      @mouseleave="onThumbLeave"
    ></div>
  </div>
</template>

<style scoped>
.zm-scroll {
  position: fixed;
  top: 0;
  right: 0;
  width: 16px;
  height: 100vh;
  z-index: 90;
  pointer-events: none;
}

.zm-scroll-thumb {
  position: absolute;
  right: 4px;
  top: 0;
  width: 8px;
  height: 28px;
  border-radius: 8px;
  background: var(--zm-scroll-glass-bg, rgba(255, 255, 255, 0.18));
  border: 1px solid var(--zm-scroll-glass-border, rgba(255, 255, 255, 0.35));
  -webkit-backdrop-filter: blur(8px) saturate(1.4);
  backdrop-filter: blur(8px) saturate(1.4);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  cursor: pointer;
  touch-action: none;
  transform: translateX(200%);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.25s ease, background 0.2s ease, width 0.2s ease, right 0.2s ease;
  will-change: transform;
}
.zm-scroll.is-visible .zm-scroll-thumb {
  transform: translateX(0);
}
.zm-scroll-thumb:hover {
  background: var(--zm-scroll-glass-hover-bg, rgba(255, 255, 255, 0.34));
  width: 11px;
  right: 3px;
}
.zm-scroll.reduce-motion .zm-scroll-thumb {
  transition: background 0.2s ease, width 0.2s ease, right 0.2s ease;
}
</style>
