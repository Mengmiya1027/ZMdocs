<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vitepress'          // VitePress 环境；若用 vue-router 可改为 'vue-router'
import { currentSong, currentTime as sharedTime, isPlaying } from '../utils/lyricStore'

const route = useRoute()                       // 获取当前路由

const API_BASE = 'https://metingapi.nanorocky.top'
const MOVE_DURATION = 0.6
const FAST_DURATION = 0.24
const bottomDuration = ref(MOVE_DURATION)

interface LrcLine {
  time: number
  text: string
  trans?: string
}
interface LrcEntry {
  lines: LrcLine[]
  status: 'loading' | 'done' | 'empty' | 'error'
}

// 缓存
const lyricsMap = new Map<string, LrcEntry>()
const cacheKeys: string[] = []
const lines = ref<LrcLine[]>([])
const activeIndex = ref(-1)

function addCache(key: string, entry: LrcEntry) {
  const idx = cacheKeys.indexOf(key)
  if (idx !== -1) {
    cacheKeys.splice(idx, 1)
  } else {
    if (cacheKeys.length >= 2) {
      const oldKey = cacheKeys.shift()
      if (oldKey) lyricsMap.delete(oldKey)
    }
  }
  cacheKeys.push(key)
  lyricsMap.set(key, entry)
}

// --- 卡片系统（仅用于右上模式） ---
interface DisplayCard {
  uid: number
  contentId: string
  line: LrcLine
  state: 'entering' | 'active' | 'leaving'
  duration: number
}

const cards = ref<DisplayCard[]>([])
let cardCounter = 0
let leaveTimer: number | null = null

function contentId(line: LrcLine): string {
  return `${line.time}_${line.text}_${line.trans || ''}`
}

const META_RE =
    /^(作词|作曲|词|曲|编曲|制作人|监制|出品|发行|企划|统筹|混音|母带|录音|人声录音|和声|弦乐|吉他|贝斯|鼓|后期|Produced by|Mixing|Mastering|Recording)\s*[:：]/i

function parseLrc(raw: string): LrcLine[] {
  const out: LrcLine[] = []
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g
  raw.split(/\r?\n/).forEach((line) => {
    re.lastIndex = 0
    const stamps: number[] = []
    let m: RegExpExecArray | null
    let last = 0
    while ((m = re.exec(line))) {
      const mm = parseInt(m[1], 10)
      const ss = parseInt(m[2], 10)
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0
      stamps.push(mm * 60 + ss + frac / 1000)
      last = re.lastIndex
    }
    if (!stamps.length) return
    const text = line.slice(last).trim()
    stamps.forEach((t) => out.push({ time: t, text }))
  })
  out.sort((a, b) => a.time - b.time)
  return out
}

function stripMeta(ls: LrcLine[]): LrcLine[] {
  return ls.filter((l) => {
    if (!l.text) return true
    if (META_RE.test(l.text)) return false
    if (l.time === 0 && l.text.includes(' - ')) return false
    return true
  })
}

function mergeTrans(plain: LrcLine[], tr: LrcLine[]): LrcLine[] {
  if (!tr.length) return plain
  const key = (t: number) => Math.round(t * 100)
  const m = new Map<number, string>()
  tr.forEach((l) => m.set(key(l.time), l.text))
  return plain.map((l) => {
    const t = m.get(key(l.time))
    if (!t || !l.text || t === l.text || !t.startsWith(l.text)) return l
    const rest = t.slice(l.text.length).trim()
    if (rest.startsWith('(') && rest.endsWith(')')) {
      const inner = rest.slice(1, -1).trim()
      if (inner) return { ...l, trans: inner }
    }
    return l
  })
}

function computeActive(time: number): number {
  const ls = lines.value
  let idx = -1
  for (let i = 0; i < ls.length; i++) {
    if (ls[i].time <= time + 0.15) idx = i
    else break
  }
  return idx
}

async function fetchLrc(server: string, id: string, tr: boolean): Promise<string> {
  const url = `${API_BASE}/?server=${server}&type=lrc&id=${id}${tr ? '&trlrc=true' : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.text()
}

// --- 右上模式动画函数 ---
function scheduleLeaveCleanup(duration: number) {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = window.setTimeout(() => {
    cards.value = cards.value.filter((c) => c.state !== 'leaving')
    leaveTimer = null
  }, duration * 1000 + 50)
}

function showCard(line: LrcLine, duration: number) {
  const cid = contentId(line)
  const existing = cards.value.find((c) => c.contentId === cid)
  if (existing) {
    if (existing.state === 'leaving') {
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }
      existing.state = 'active'
      existing.duration = duration
    }
    return
  }

  const active = cards.value.find((c) => c.state === 'active')
  if (active) {
    active.state = 'leaving'
    active.duration = duration
    scheduleLeaveCleanup(duration)
  }

  const newCard: DisplayCard = {
    uid: ++cardCounter,
    contentId: cid,
    line,
    state: 'entering',
    duration,
  }
  cards.value.push(newCard)

  const uid = newCard.uid
  nextTick(() => {
    const el = document.querySelector(`[data-card-uid="${uid}"]`) as HTMLElement
    if (el) void el.offsetHeight
    const idx = cards.value.findIndex((c) => c.uid === uid)
    if (idx !== -1) {
      cards.value[idx].state = 'active'
    }
  })
}

function hideCards(fast = false) {
  const duration = fast ? FAST_DURATION : MOVE_DURATION
  cards.value.forEach((c) => {
    if (c.state === 'active' || c.state === 'entering') {
      c.state = 'leaving'
      c.duration = duration
    }
  })
  if (cards.value.some((c) => c.state === 'leaving')) {
    scheduleLeaveCleanup(duration)
  }
}

function clearCards() {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  cards.value = []
}

// ---------- 监听器 ----------
watch(
    currentSong,
    async (s) => {
      try {
        sharedTime.value = 0
        clearCards()
        activeIndex.value = -1
        lines.value = []
        if (!s?.id || !s?.server) return

        const key = `${s.id}|||${s.server}`
        let entry = lyricsMap.get(key)

        if (entry) {
          const idx = cacheKeys.indexOf(key)
          if (idx !== -1) {
            cacheKeys.splice(idx, 1)
            cacheKeys.push(key)
          }
          if (entry.status === 'done') {
            lines.value = entry.lines
            const i = computeActive(sharedTime.value)
            activeIndex.value = i
            if (i >= 0 && entry.lines[i].text && isPlaying.value) {
              showCard(entry.lines[i], MOVE_DURATION)
            }
          }
          return
        }

        const [plainR, trR] = await Promise.allSettled([
          fetchLrc(s.server, s.id, false),
          fetchLrc(s.server, s.id, true),
        ])

        if (currentSong.value.id !== s.id || currentSong.value.server !== s.server) return

        if (plainR.status !== 'fulfilled') {
          return
        }

        const plain = stripMeta(parseLrc(plainR.value))
        const tr = trR.status === 'fulfilled' ? parseLrc(trR.value) : []
        const parsedLines = mergeTrans(plain, tr)

        if (!parsedLines.some((l) => l.text)) {
          return
        }

        const newEntry: LrcEntry = { lines: parsedLines, status: 'done' }
        addCache(key, newEntry)
        lines.value = parsedLines
        const i = computeActive(sharedTime.value)
        activeIndex.value = i
        if (i >= 0 && parsedLines[i].text && isPlaying.value) {
          showCard(parsedLines[i], MOVE_DURATION)
        }
      } finally {
        await nextTick()
        updateMode()
      }
    },
    { immediate: true }
)

watch(isPlaying, (p) => {
  if (p) {
    if (cards.value.length === 0 && activeIndex.value >= 0 && lines.value[activeIndex.value]?.text) {
      showCard(lines.value[activeIndex.value], MOVE_DURATION)
    }
  }
})

let lastTime = -1
watch(sharedTime, (t) => {
  if (!lines.value.length) return
  const i = computeActive(t)
  const prev = activeIndex.value
  const dt = lastTime < 0 ? 0 : t - lastTime
  lastTime = t

  const gap =
      i >= 0 && prev >= 0 && lines.value[i] && lines.value[prev]
          ? lines.value[i].time - lines.value[prev].time
          : 999

  const seekJump = dt > 1.2 || dt < -0.05 || i - prev > 1
  const duration = seekJump
      ? FAST_DURATION
      : Math.min(MOVE_DURATION, Math.max(0.16, gap * 0.75))

  bottomDuration.value = duration
  if (i === prev) return
  activeIndex.value = i

  if (i < 0 || !lines.value[i]?.text) {
    hideCards(seekJump)
  } else {
    showCard(lines.value[i], duration)
  }
})

// ---------- 底部 / 右上模式切换 ----------
const isBottomMode = ref(false)
const teleportTarget = ref<HTMLElement | string>(document.body)
const wrapperLeft = ref(0)

// 底部模式下当前显示的歌词行
const currentLine = computed(() => {
  if (activeIndex.value < 0 || !lines.value.length) return null
  return lines.value[activeIndex.value] || null
})

function updateMode() {
  const w = window.innerWidth
  // 🔥 关键修改：若当前路径为首页，强制启用底部模式并传送到 body
  if (route.path === '/') {
    isBottomMode.value = true
    teleportTarget.value = document.body
    wrapperLeft.value = window.innerWidth / 2   // 水平居中
    return
  }

  // 非首页：按原有宽度逻辑判断
  if (w < 1280) {
    const container = document.querySelector('.content:has(.content-container)') as HTMLElement
    if (container) {
      isBottomMode.value = true
      teleportTarget.value = container
      const rect = container.getBoundingClientRect()
      wrapperLeft.value = rect.left + rect.width / 2
      return
    }
  }
  isBottomMode.value = false
}

// 滚动时更新 wrapperLeft（仅非首页有效）
function updateWrapperLeft() {
  // 若当前是首页，不做任何事（因为固定居中，滚动不影响）
  if (route.path === '/') return
  if (!isBottomMode.value) return
  const container = document.querySelector('.content:has(.content-container)') as HTMLElement
  if (container) {
    const rect = container.getBoundingClientRect()
    wrapperLeft.value = rect.left + rect.width / 2
  }
}

// 监听路由变化，重新判断模式
watch(() => route.path, () => {
  updateMode()
})

onMounted(() => {
  setTimeout(updateMode, 50)
  window.addEventListener('resize', updateMode)
  window.addEventListener('scroll', updateWrapperLeft, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMode)
  window.removeEventListener('scroll', updateWrapperLeft)
})
</script>

<template>
  <!-- ===== 底部模式（无动画，单卡直接显示） ===== -->
  <Teleport v-if="isBottomMode" :to="teleportTarget">
    <div class="bottom-wrapper" :class="{ 'home-page': route.path === '/' }" :style="{ left: wrapperLeft + 'px', '--dur': bottomDuration + 's' }">
      <!-- 新增包裹层，hover 动画转移到此层 -->
      <div class="bottom-card-wrapper">
        <Transition name="fade" mode="out-in">
          <div v-if="currentLine" :key="activeIndex" class="lyric-card bottom-card">
            <img v-if="currentSong.cover" :src="currentSong.cover" alt="cover" class="cover-img" />
            <div class="lyric-line">{{ currentLine.text }}</div>
            <div v-if="currentLine.trans" class="lyric-trans">{{ currentLine.trans }}</div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>

  <!-- ===== 右上模式（带动画，保留原样） ===== -->
  <div v-else class="lyric-widget">
    <div class="lyric-stage">
      <div
          v-for="card in cards"
          :key="card.uid"
          :data-card-uid="card.uid"
          class="lyric-card"
          :class="{
          'card-entering': card.state === 'entering',
          'card-active': card.state === 'active',
          'card-leaving': card.state === 'leaving',
        }"
          :style="{ '--dur': card.duration + 's' }"
      >
        <div class="lyric-line">{{ card.line.text }}</div>
        <div v-if="card.line.trans" class="lyric-trans">{{ card.line.trans }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 右上模式样式（不变） ---------- */
.lyric-widget {
  position: fixed;
  top: calc(var(--vp-nav-height, 64px) + var(--vp-layout-top-height, 0px) + 24px);
  right: 24px;
  width: 256px;
  z-index: 25;
  pointer-events: none;
}
.lyric-stage {
  position: relative;
  width: 100%;
  min-height: 130px;
}
.lyric-card {
  --dur: 0.6s;
  position: absolute;
  top: 0;
  right: 0;
  width: max-content;
  max-width: 100%;
  padding: 6px 8px;
  box-sizing: border-box;
  text-align: right;
  border-radius: 16px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  transition: transform var(--dur, 0.6s) cubic-bezier(0.22, 0.61, 0.36, 1),
  color var(--dur, 0.6s) ease,
  border-color var(--dur, 0.6s) ease,
  box-shadow var(--dur, 0.6s) ease,
  background-color var(--dur, 0.6s) ease,
  backdrop-filter var(--dur, 0.6s) ease;
}
.card-entering {
  transform: translate(160%, 20px);
  color: transparent;
  border-color: transparent;
  box-shadow: none;
  background-color: transparent;
  backdrop-filter: blur(0px) saturate(100%);
}
.card-active {
  transform: translate(0, 0);
  color: var(--vp-c-text-1);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
}
.card-leaving {
  transform: translate(160%, 0);
  color: transparent;
  border-color: transparent;
  box-shadow: none;
  background-color: transparent;
  backdrop-filter: blur(0px) saturate(100%);
}
.lyric-line {
  font-weight: bold;
}
.lyric-trans {
  font-size: 13px;
  font-weight: 400;
  color: var(--vp-c-text-2);
  transition: color 0.46s ease;
  overflow-wrap: anywhere;
}
.card-entering .lyric-trans,
.card-leaving .lyric-trans {
  color: transparent;
}
@media (max-width: 960px) {
  .lyric-widget {
    display: none;
  }
}

/* ---------- 底部模式样式 ---------- */
.bottom-wrapper {
  position: fixed;
  bottom: 0;
  padding-bottom: 1vh;
  transform: translateX(-50%);
  z-index: 25;
  pointer-events: auto;
}

/* 新增包裹层：承载 hover 位移动画 */
.bottom-card-wrapper {
  display: inline-block;          /* 宽度由内容撑开 */
  transition: transform .3s ease;
}

/* hover 时整个包裹层向上平移（原来作用于 .bottom-card） */
.bottom-wrapper:hover .bottom-card-wrapper {
  transform: translateY(calc(100% + 2vh));
}

.cover-img {
  height: 20px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 50px;
  flex-shrink: 0;
}

.bottom-card {
  position: relative;
  display: flex;
  width: max-content;
  max-width: 90vw;
  padding: 6px 8px;
  box-sizing: border-box;
  text-align: center;
  border-radius: 16px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity max(calc(var(--dur, 0.1s) - 0.5s) , 0.1s) ease !important;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1280px) {
  .lyric-line{
    margin-left: 2px;
    font-size: 15px;
    line-height: 20px;
    height: fit-content;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80vh;
  }
  .lyric-card:has(.lyric-trans) .lyric-line{
    max-width: 40vw;
  }
  .lyric-trans{
    height: fit-content;
    line-height: 13px;
    margin: auto 0 auto 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lyric-card{
    padding: 2px 4px 2px 2px;
    border-radius: 50px;
  }
}

.bottom-wrapper.home-page .lyric-line{
  margin-left: 2px;
  font-size: 15px;
  line-height: 20px;
  height: fit-content;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80vh;
}

.bottom-wrapper.home-page .lyric-card:has(.lyric-trans) .lyric-line{
  max-width: 40vw;
}

.bottom-wrapper.home-page .lyric-trans{
  line-height: 13px;
  height: fit-content;
  margin: auto 0 auto 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-wrapper.home-page .lyric-card{
  padding: 2px 4px 2px 2px;
  border-radius: 50px;
}
</style>