<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const rail = ref<HTMLElement | null>(null)
const thumb = ref<HTMLElement | null>(null)
const visible = ref(false)

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 行为参数
const PROX = 64 // 鼠标距右缘多近算"靠近"
const IDLE_HIDE = 600 // 滚动停止后多久自动推出
const NEAR_HIDE = 300 // 鼠标离远 / thumb 移出后多久推出
const NEAR_KEEP = 1200 // 鼠标靠近右缘时的隐藏延迟：避免"鼠标停右缘静止"死区（原只 clearTimeout 不 scheduleHide → 永久不隐藏）
const RESIZE_HIDE = 150 // 缩窗后多久自动推出（比 hover 更短：缩窗非交互意图）

let viewportH = 0
let scrollH = 0
let navOffset = 0 // 顶栏下沿偏移：rail 与 thumb 轨道都从这一高度开始，避免挡住顶栏
let trackH = 0 // 实际可滚动轨道高度 = viewportH - navOffset
let thumbH = 28
let rafPending = false
let dragging = false
let startY = 0
let startScroll = 0
let hideTimer: number | undefined
let measureTimer: number | undefined
let mo: MutationObserver | undefined
let lastMouseX = 1e9

function isNear() {
  return lastMouseX > window.innerWidth - PROX
}

// 测量顶栏玻璃下沿：rail 与 thumb 轨道从这一高度开始，避免重叠顶栏。
// 取 .VPNavBar .container 的底边（即玻璃胶囊/玻璃条的实际下沿），
// 仅在它确实位于视口上方区域时才作为偏移，否则回退为 0（无顶栏页面）。
function getNavOffset() {
  const el = document.querySelector('.VPNavBar .container') as HTMLElement | null
  if (!el) return 0
  const r = el.getBoundingClientRect()
  if (r.bottom > 0 && r.bottom < window.innerHeight * 0.6) return r.bottom
  return 0
}

// 计算可视高度、页面总高、thumb 高度，并刷新位置
function measure() {
  viewportH = window.innerHeight
  scrollH = document.documentElement.scrollHeight
  navOffset = getNavOffset()
  trackH = viewportH - navOffset
  const ratio = viewportH / scrollH
  thumbH = Math.max(28, Math.min(trackH * ratio, trackH))
  if (thumb.value) thumb.value.style.height = thumbH + 'px'
  if (rail.value) {
    rail.value.style.top = navOffset + 'px'
    rail.value.style.height = trackH + 'px'
  }
  position()
  updateRailDisplay()
}

// 不可滚动时整体隐藏
function updateRailDisplay() {
  if (!rail.value) return
  const show = scrollH > viewportH + 2
  rail.value.style.display = show ? 'block' : 'none'
}

// 窗口缩放：重算度量后调度一次"推出"。
// 缩窗常伴随鼠标停在右缘（拖边框），mousemove 已 show 且清掉了隐藏计时器，
// 松手后鼠标不动、不再有 mousemove，"离远"判定永不触发，故需 resize 自行隐藏。
// 拖拽 thumb 时不打断用户操作。
function onResize() {
  measure()
  if (dragging) return
  scheduleHide(RESIZE_HIDE)
}

// 根据当前滚动位置定位 thumb（仅改 top，避免与推入/推出的 transform 冲突）
function position() {
  if (!thumb.value) return
  const maxScroll = scrollH - viewportH
  const maxTop = trackH - thumbH
  const top = maxScroll > 0 ? (window.scrollY / maxScroll) * maxTop : 0
  thumb.value.style.top = top + 'px'
}

// 推入显示
function show() {
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
}
// 调度推出（断点倒计时，可被新的 show 打断）
function scheduleHide(delay: number) {
  if (dragging) return // 拖动期间绝不隐藏，避免拖到一半滚动条消失
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    visible.value = false
  }, delay)
}

function onScroll() {
  if (!rafPending) {
    rafPending = true
    requestAnimationFrame(() => {
      position()
      rafPending = false
    })
  }
  show()
  // 靠近右缘也按较长延迟安排隐藏，避免"鼠标停右缘静止"死区
  scheduleHide(isNear() ? NEAR_KEEP : IDLE_HIDE)
}

// 鼠标全局移动：靠近右缘推入并保持，离远 0.3s 推出
function onMouseMove(e: MouseEvent) {
  lastMouseX = e.clientX
  if (isNear()) {
    show()
    scheduleHide(NEAR_KEEP) // 靠近右缘：排较长隐藏，而非永久保持
  } else {
    scheduleHide(NEAR_HIDE)
  }
}
// 鼠标真正离开窗口（移到浏览器外/桌面）：立即隐藏。
// 否则鼠标移出后浏览器不再投递 mousemove，状态卡在显示，
// 必须等窗口重新 focus（点一下）才恢复投递 —— 即用户遇到的"需要点一下才收回"。
function onDocLeave() {
  if (dragging) return
  visible.value = false
}
// 窗口失焦（切到别的程序）：同样立即隐藏
function onBlur() {
  if (dragging) return
  visible.value = false
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
  startScroll = window.scrollY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  document.body.style.userSelect = 'none'
  show()
  if (hideTimer) clearTimeout(hideTimer)
}
function onThumbMove(e: PointerEvent) {
  if (!dragging) return
  const maxScroll = scrollH - viewportH
  const maxTop = trackH - thumbH
  const delta = e.clientY - startY
  const ratio = maxTop > 0 ? delta / maxTop : 0
  window.scrollTo({ top: startScroll + ratio * maxScroll })
}
function onThumbUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  document.body.style.userSelect = ''
  ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  scheduleHide(NEAR_HIDE) // 松手后安排隐藏，避免"松手后鼠标停在 thumb 上静止"死区
}

const route = useRoute()
watch(
  () => route.path,
  () => nextTick(() => setTimeout(measure, 80))
)

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  window.addEventListener('load', measure)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('blur', onBlur)
  document.addEventListener('mouseleave', onDocLeave)
  // 内容高度变化（图片 / 字体 / 动态内容 / 客户端路由）时重新测量
  // 注意：此处只能用独立的 measureTimer，绝不能 clearTimeout(hideTimer)——
  // 否则页面任何持续的 DOM 变动都会打断"自动隐藏倒计时"，导致滚动条卡在显示。
  mo = new MutationObserver(() => {
    if (measureTimer) clearTimeout(measureTimer)
    measureTimer = window.setTimeout(measure, 150)
  })
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('load', measure)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('blur', onBlur)
  document.removeEventListener('mouseleave', onDocLeave)
  if (hideTimer) clearTimeout(hideTimer)
  if (measureTimer) clearTimeout(measureTimer)
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
/* 浮层：固定在视口右缘，整体不拦截指针（仅 thumb 可交互），不挡内容点击 */
.zm-scroll {
  position: fixed;
  top: 0;
  right: 0;
  width: 16px;
  height: 100vh;
  z-index: 90;
  pointer-events: none;
}

/* 玻璃质感拇指：半透明 + 背景模糊 + 细描边；无独立轨道，仅靠 thumb 表现。
   垂直定位用 top，推入/推出用 transform: translateX（与定位解耦，便于打断）。 */
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
  /* 默认推出屏幕外（隐藏态）；is-visible 时推回到 0 */
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
/* 减少动效：推入/推出改为瞬切，不排队 */
.zm-scroll.reduce-motion .zm-scroll-thumb {
  transition: background 0.2s ease, width 0.2s ease, right 0.2s ease;
}
</style>
