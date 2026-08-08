<script setup lang="ts">
import { ref, watch } from 'vue'
import { currentSong, currentTime as sharedTime, isPlaying } from '../utils/lyricStore'

const API_BASE = 'https://metingapi.nanorocky.top'
const GAP = 8 // 新卡起始位置相对旧卡底部的间距
const MOVE = 600 // 新卡从右下方斜向左上推入定格的时长（与 CSS transition 一致）
const FAST = 240 // 打断/快进时的快速过渡时长

interface LrcLine {
  time: number
  text: string
  trans?: string
}
interface LrcEntry {
  lines: LrcLine[]
  status: 'loading' | 'done' | 'empty' | 'error'
}

// 按 歌曲(id+server) 缓存歌词，切歌/切回不重复请求
const lyricsMap = new Map<string, LrcEntry>()

const wrap = ref<HTMLElement | null>(null)
const lines = ref<LrcLine[]>([])
const activeIndex = ref(-1)
let restCard: HTMLElement | null = null

// 制作信息行（词/曲/编曲/混音…），不当作歌词展示
const META_RE =
  /^(作词|作曲|词|曲|编曲|制作人|监制|出品|发行|企划|统筹|混音|母带|录音|人声录音|和声|弦乐|吉他|贝斯|鼓|后期|Produced by|Mixing|Mastering|Recording)\s*[:：]/i

// 解析 LRC 文本 -> 带时间戳的行（支持一行多时间戳、[mm:ss.xx]）
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

// 过滤：制作信息行 + 开头的 "歌名 - 歌手" 行；空行保留（间奏时让卡片消失）
function stripMeta(ls: LrcLine[]): LrcLine[] {
  return ls.filter((l) => {
    if (!l.text) return true
    if (META_RE.test(l.text)) return false
    if (l.time === 0 && l.text.includes(' - ')) return false
    return true
  })
}

// 合并翻译：trlrc 版本的同一时间戳文本形如 "原文 (译文)"，
// 与纯净版逐行比对得出译文，避免误伤原文里自带的括号。
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

// 当前播放时间 -> 当前行索引
function computeActive(time: number): number {
  const ls = lines.value
  let idx = -1
  for (let i = 0; i < ls.length; i++) {
    if (ls[i].time <= time + 0.15) idx = i
    else break
  }
  return idx
}

function lineKey(l: LrcLine): string {
  return `${l.text}\u0000${l.trans ?? ''}`
}

function setCardContent(c: HTMLElement, l: LrcLine) {
  c.dataset.key = lineKey(l)
  c.innerHTML = ''
  const main = document.createElement('div')
  main.className = 'lyric-line'
  main.textContent = l.text
  c.appendChild(main)
  if (l.trans) {
    const tr = document.createElement('div')
    tr.className = 'lyric-trans'
    tr.textContent = l.trans
    c.appendChild(tr)
  }
}

// 推入动画结束后复位：解散合成层 + 撤掉 will-change，让 Windows 分数缩放下
// 文字重新按文档流栅格化、恢复 Cleartype（解决歌词卡文字模糊）。
// 仅对"当前静止卡"生效；正在退场/打断的卡不复位，让其自然移除。
function onSettle(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  const c = e.currentTarget as HTMLElement
  if (c !== restCard) return
  c.style.transform = '' // 回落到 none，文字脱离合成层
  c.style.willChange = 'auto'
  c.removeEventListener('transitionend', onSettle)
}

// 新建卡片，初始为"淡出态"，随后移除该类触发淡入
function mkCard(l: LrcLine): HTMLElement {
  const c = document.createElement('div')
  c.className = 'lyric-card lyric-card--hidden'
  setCardContent(c, l)
  c.style.willChange = 'transform' // 动画期临时提升合成层，静止时由 onSettle 撤掉
  c.addEventListener('transitionend', onSettle)
  wrap.value?.appendChild(c)
  return c
}

// 淡出并移除（slide=true 时同时向右滑出屏幕）
function dismiss(c: HTMLElement | null, slide: boolean) {
  if (!c) return
  c.classList.add('lyric-card--hidden')
  if (slide) c.style.transform = 'translate(160%,0)'
  setTimeout(() => {
    if (c.parentNode) c.remove()
  }, MOVE + 80)
}

// 打断退场：快速向右下轻推 + 轻微缩小 + 淡出（沿用 --hidden 的玻璃不发白方案，过渡更短）。
// 此处恢复 transform(含 scale)，打断瞬间文字会轻微模糊——用户接受该短暂状态以保留缩小手感。
function interruptOut(c: HTMLElement | null) {
  if (!c || c.classList.contains('lyric-card--interrupt')) return
  c.classList.add('lyric-card--interrupt')
  c.style.transform = 'translate(72%, 8px) scale(0.93)'
  setTimeout(() => {
    if (c.parentNode) c.remove()
  }, FAST + 120)
}

function clearCards() {
  if (wrap.value) {
    // 保留正在做打断退场的卡片，让它自行淡出完再移除（切歌/恢复时不会被瞬间清空）
    for (const el of Array.from(wrap.value.children)) {
      if (!(el instanceof HTMLElement) || !el.classList.contains('lyric-card--interrupt')) {
        el.remove()
      }
    }
  }
  restCard = null
}

// 无歌词 / 间奏空行：卡片原地淡出消失
function hideRest() {
  dismiss(restCard, false)
  restCard = null
}

// 推入一张静止卡（dur 控制推入时长，自适应）。首行/间奏后也走推入，保证"都有推入"。
function showRest(l: LrcLine, dur = 0.6) {
  clearCards()
  const c = mkCard(l)
  c.style.setProperty('--dur', dur + 's')
  c.style.transform = 'translate(160%, 0)' // 从右下方推入
  void c.offsetWidth
  requestAnimationFrame(() => {
    if (c.parentNode) {
      c.classList.remove('lyric-card--hidden')
      c.style.transform = 'translate(0,0)'
    }
  })
  restCard = c
}

// 切换：每一行都有完整的「对角推入 + 同帧滑出」接力，无任何"原地淡入/无动画"降级。
// 时长自适应（dur）：慢歌慢、快歌词快（按行间隔 gap 缩放，下限 0.16s 保可见）。
// 旧卡永远被新卡打断，因此再快的歌词也不会丢动画。
function animateTo(l: LrcLine, dur = 0.6) {
  if (!l.text) return hideRest() // 间奏空行 -> 卡片消失
  const k = lineKey(l)
  if (restCard && restCard.dataset.key === k) return // 同一行不重复动画

  // 清理堆积的退场旧卡，避免节点无限增长（最多保留 2 张正在退场的）
  if (wrap.value) {
    const exiting = Array.from(wrap.value.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c !== restCard
    )
    for (let idx = 0; idx < exiting.length - 2; idx++) exiting[idx].remove()
  }

  const old = restCard
  if (!old) return showRest(l, dur) // 当前无卡（开头/间奏后）-> 推入

  // 新卡从右下方斜向左上推入，旧卡同帧向右滑出（接力）
  const row = old.offsetHeight + GAP
  const n = mkCard(l)
  n.style.setProperty('--dur', dur + 's')
  n.style.transform = `translate(160%, ${row}px)`
  void n.offsetWidth
  requestAnimationFrame(() => {
    if (n.parentNode) {
      n.classList.remove('lyric-card--hidden')
      n.style.transform = 'translate(0,0)'
    }
    if (old) {
      old.style.setProperty('--dur', dur + 's')
      dismiss(old, true) // 旧卡同一帧启动向右滑出
    }
  })
  restCard = n
}

async function fetchLrc(server: string, id: string, tr: boolean): Promise<string> {
  const url = `${API_BASE}/?server=${server}&type=lrc&id=${id}${tr ? '&trlrc=true' : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.text()
}

// 当前曲变化 -> 拉取歌词（原文 + 翻译，翻译失败不影响原文）
// 注意：无歌词 / 加载中 / 失败一律不显示卡片，只有歌词真的走起来才出现。
watch(
  currentSong,
  async (s) => {
    if (typeof document === 'undefined') return // 仅客户端执行（SSR 无 document）
    // 切歌：当前卡片做打断退场，不再瞬间清空（退场动画由 interruptOut 自行收尾）
    if (restCard) interruptOut(restCard)
    restCard = null
    activeIndex.value = -1
    lines.value = []
    if (!s || !s.id || !s.server) return

    const key = `${s.id}|||${s.server}`
    let entry = lyricsMap.get(key)
    if (!entry) {
      entry = { lines: [], status: 'loading' }
      lyricsMap.set(key, entry)
      const [plainR, trR] = await Promise.allSettled([
        fetchLrc(s.server, s.id, false),
        fetchLrc(s.server, s.id, true)
      ])
      if (plainR.status !== 'fulfilled') {
        entry.status = 'error'
      } else {
        const plain = stripMeta(parseLrc(plainR.value))
        const tr = trR.status === 'fulfilled' ? parseLrc(trR.value) : []
        entry.lines = mergeTrans(plain, tr)
        entry.status = entry.lines.some((l) => l.text) ? 'done' : 'empty'
      }
      // 请求期间可能已切歌，结果作废
      if (currentSong.value.id !== s.id || currentSong.value.server !== s.server) return
    }
    if (entry.status !== 'done') return
    lines.value = entry.lines
    const i = computeActive(sharedTime.value)
    activeIndex.value = i
    // 暂停或刚切歌时只记住行号，真正播放时由进度 / isPlaying watch 再显示
    if (i >= 0 && entry.lines[i].text) {
      if (isPlaying.value) showRest(entry.lines[i])
    } else if (isPlaying.value) {
      hideRest()
    }
  },
  { immediate: true }
)

// 播放被打断（暂停 / 停止 / 播完）：当前卡片快速退场；恢复播放由进度 watch 自然重新显示
watch(isPlaying, (p) => {
  if (typeof document === 'undefined') return // 仅客户端执行
  if (!p) {
    if (restCard) interruptOut(restCard)
    restCard = null
    activeIndex.value = -1
  }
})

// 播放进度变化 -> 计算当前行 -> 触发切换
let lastT = -1
watch(sharedTime, (t) => {
  if (typeof document === 'undefined') return // 仅客户端执行
  if (!lines.value.length) return
  const i = computeActive(t)
  const prevActive = activeIndex.value
  const dt = lastT < 0 ? 0 : t - lastT
  lastT = t
  // 行间隔（当前行与上一行的时差），用于自适应动画时长
  const gap = i >= 0 && prevActive >= 0 && lines.value[i] && lines.value[prevActive]
    ? lines.value[i].time - lines.value[prevActive].time
    : 999
  // 快进 / 拖进度条 / 跳行过多 -> 固定短时长；否则按行间隔自适应（慢歌慢、快歌词快）
  const seekJump = dt > 1.2 || dt < -0.05 || i - prevActive > 1
  const dur = seekJump ? 0.26 : Math.min(0.6, Math.max(0.16, gap * 0.75))
  if (i === prevActive) return
  activeIndex.value = i
  if (i < 0) return hideRest() // 退回前奏 -> 卡片消失
  animateTo(lines.value[i], dur)
})
</script>

<template>
  <div class="lyric-widget">
    <div class="lyric-stage" ref="wrap"></div>
  </div>
</template>

<style scoped>
.lyric-widget {
  position: fixed;
  /* 跟随顶栏实际高度下移，避免遮挡（首页主题把 --vp-nav-height 改成 48px，故不能写死） */
  top: calc(var(--vp-nav-height, 64px) + var(--vp-layout-top-height, 0px) + 24px);
  right: 24px;
  width: 360px; /* 卡片宽度自适应内容，这里只作为上限 */
  z-index: 25; /* 低于顶栏(--vp-z-index-nav:30)，高于正文 */
  pointer-events: none;
}

.lyric-stage {
  position: relative;
  width: 100%;
  min-height: 130px; /* 容纳静止卡 + 切换时的第二张卡 */
}

/* 卡片由 JS 动态创建，拿不到 scoped 的 data-v 属性，必须用 :deep 穿透。
   玻璃材质放在 ::before 上、且其 opacity 恒为 1：
   一旦对带 backdrop-filter 的元素（或其祖先）做 opacity 动画，浏览器会新建
   backdrop root，采样不到真实页面背景，卡片就会在动画中"发白"。 */
.lyric-stage :deep(.lyric-card) {
  position: absolute;
  top: 0;
  right: 0; /* 右边缘对齐，卡片向左生长 */
  width: max-content; /* 宽度自适应内容 */
  min-width: 88px;
  max-width: 100%; /* 超出上限才换行 */
  min-height: 52px;
  padding: 12px 16px;
  box-sizing: border-box;
  text-align: left;
  z-index: 0; /* 建立层叠上下文，让 ::before(z-index:-1) 落在文字之下而非页面之后 */
  background: transparent; /* 背景交给 ::before */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  transition: transform var(--dur, 0.6s) cubic-bezier(0.22, 0.61, 0.36, 1),
    color var(--dur, 0.6s) ease, border-color var(--dur, 0.6s) ease,
    box-shadow var(--dur, 0.6s) ease;
}

.lyric-stage :deep(.lyric-card)::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  -webkit-backdrop-filter: var(--zm-backdrop-blur-medium);
  transition: background-color var(--dur, 0.6s) ease, backdrop-filter var(--dur, 0.6s) ease,
    -webkit-backdrop-filter var(--dur, 0.6s) ease;
}

/* 淡出态：只过渡 color / background-color / blur / border / shadow，opacity 全程为 1 */
.lyric-stage :deep(.lyric-card--hidden) {
  color: transparent;
  border-color: rgba(255, 255, 255, 0);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0);
}

.lyric-stage :deep(.lyric-card--hidden)::before {
  background-color: transparent;
  backdrop-filter: blur(0px) saturate(100%);
  -webkit-backdrop-filter: blur(0px) saturate(100%);
}

/* 打断退场：更短的过渡 + 向右下轻推缩小（玻璃仍不发白，复用 --hidden 的淡出属性） */
.lyric-stage :deep(.lyric-card--interrupt) {
  transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease,
    border-color 0.2s ease, box-shadow 0.2s ease;
  color: transparent;
  border-color: rgba(255, 255, 255, 0);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0);
}

.lyric-stage :deep(.lyric-card--interrupt)::before {
  background-color: transparent;
  backdrop-filter: blur(0px) saturate(100%);
  -webkit-backdrop-filter: blur(0px) saturate(100%);
  transition: background-color 0.2s ease, backdrop-filter 0.2s ease,
    -webkit-backdrop-filter 0.2s ease;
}

/* 快进 / 跳行 / 极快歌词段：快速淡入淡出（snap），不做对角滑入 */
.lyric-stage :deep(.lyric-card--fast) {
  transition: transform 0.22s ease, color 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.lyric-stage :deep(.lyric-card--fast)::before {
  transition: background-color 0.2s ease, backdrop-filter 0.2s ease,
    -webkit-backdrop-filter 0.2s ease;
}

.lyric-stage :deep(.lyric-line) {
  overflow-wrap: anywhere;
}

.lyric-stage :deep(.lyric-trans) {
  margin-top: 4px;
  font-size: 13.5px;
  font-weight: 400;
  color: var(--vp-c-text-2);
  transition: color 0.46s ease;
  overflow-wrap: anywhere;
}

.lyric-stage :deep(.lyric-card--hidden) .lyric-trans {
  color: transparent;
}

@media (max-width: 960px) {
  .lyric-widget {
    display: none;
  }
}
</style>
