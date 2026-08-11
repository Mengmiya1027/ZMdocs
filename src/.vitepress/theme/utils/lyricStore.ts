import { ref } from 'vue'

// 当前播放曲目，由 BGMusic 广播、LyricCard 订阅。
export interface CurrentSong {
  id?: string
  server?: 'netease' | 'tencent'
  title?: string
  author?: string
  cover?: string  // 新增封面图链接
}

export const currentSong = ref<CurrentSong>({})

// 播放进度（秒），由 BGMusic 在 timeupdate 广播，LyricCard 据此计算当前行
export const currentTime = ref(0)

// 播放状态（是否正在播放），由 BGMusic 广播，LyricCard 用于触发"打断"退场动画
export const isPlaying = ref(false)

// 默认歌单的 flink 形如 https://metingapi.nanorocky.top/?server=tencent&type=url&id=XXXX
// 从中解析出 id 与 server，避免改动 default-music.json。
export function songIdServerFromFlink(
  flink?: string
): { id?: string; server?: 'netease' | 'tencent' } {
  const res: { id?: string; server?: 'netease' | 'tencent' } = {}
  if (!flink) return res
  try {
    const u = new URL(flink)
    const id = u.searchParams.get('id')
    if (id) res.id = id
    const s = u.searchParams.get('server')
    if (s === 'netease' || s === 'tencent') res.server = s
  } catch {
    // flink 不是合法 URL 时静默忽略
  }
  return res
}
