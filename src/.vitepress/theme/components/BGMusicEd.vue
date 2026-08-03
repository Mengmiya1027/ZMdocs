<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal-fade" appear>
        <div v-if="showModal" class="modal-overlay" @click="closeModal"></div>
      </Transition>
      <Transition   name="modal-3d" appear @after-leave="onAfterLeave">
      <!-- 主窗口 -->
        <div v-if="showModal" class="modal-window">
          <!-- 关闭 -->
          <button class="btn-close" @click="closeModal" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 标题 -->
          <div class="modal-header">
            <h2 class="modal-title">音乐管理</h2>
          </div>

          <!-- ===== 搜索区域 ===== -->
          <div class="search-section">
            <div class="search-row">
              <!-- 自定义下拉：平台切换 -->
              <div class="dropdown-wrap" ref="dropdownRef">
                <button
                    class="dropdown-trigger"
                    @click="toggleDropdown"
                    :aria-expanded="dropdownOpen"
                    type="button"
                >
                  <span class="platform-icon" v-html="currentPlatformIcon"></span>
                  <span class="dropdown-label">{{ currentPlatformLabel }}</span>
                  <svg
                      class="dropdown-arrow"
                      :class="{ open: dropdownOpen }"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <!-- 下拉选项 -->
                <div class="dropdown-menu" :class="{ open: dropdownOpen }">
                  <div
                      v-for="option in platformOptions"
                      :key="option.value"
                      class="dropdown-item"
                      :class="{ active: selectedServer === option.value }"
                      @click="selectPlatform(option.value)"
                  >
                    <span class="platform-icon" v-html="option.icon"></span>
                    <span class="item-label">{{ option.label }}</span>
                    <svg
                        v-if="selectedServer === option.value"
                        class="item-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- 搜索框 -->
              <div class="search-input-wrap">
                <svg class="search-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    v-model="searchKeyword"
                    placeholder="输入歌名或歌手…"
                    class="search-input"
                    @keyup.enter="handleSearch"
                    @input="onSearchInput"
                />
                <button
                    v-if="searchKeyword"
                    class="search-clear"
                    @click="clearSearch"
                    aria-label="清空"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <button class="btn-search" @click="handleSearch" :disabled="isSearching">
                {{ isSearching ? '…' : '搜索' }}
              </button>
            </div>

            <!-- 搜索结果（条件渲染，无过渡，保证 v-else-if 连续） -->
            <div
                v-if="searchResults.length > 0"
                class="search-results"
                ref="searchResultsRef"
                @scroll="onSearchScroll"
            >
              <div
                  class="result-item"
                  v-for="(item, idx) in displayedResults"
                  :key="idx"
              >
                <img
                    :src="item.pic || item.cover || ''"
                    alt="封面"
                    class="result-cover"
                    loading="lazy"
                    @error="(e) => e.target.src = '/images/ui/cover.png'"
                />
                <div class="result-info">
                  <div class="result-title">{{ item.name || item.title || '未知' }}</div>
                  <div class="result-artist">{{ item.artist || item.author || '未知歌手' }}</div>
                </div>
                <button class="btn-add" @click.stop="addToPlaylist(item)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>添加</span>
                </button>
              </div>
              <div v-if="displayedCount < searchResults.length" class="load-more-trigger">
                滚动加载更多…
              </div>
            </div>
            <div v-else-if="hasSearched && searchKeyword && !isSearching" class="search-status">未找到相关歌曲</div>
            <div v-else-if="isSearching" class="search-status">搜索中…</div>
          </div>

          <!-- ===== 播放列表 ===== -->
          <div class="playlist-section">
            <div class="playlist-header">
              <span class="playlist-title">播放列表</span>
            </div>

            <div class="playlist-scroll">
              <div
                  v-if="playlist.length === 0"
                  class="empty-state"
              >
                <svg class="empty-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M664.393143 0.365714c12.690286 0 24.758857 5.558857 33.024 15.213715l208.457143 243.2c6.765714 7.862857 10.496 17.92 10.496 28.306285v683.264a43.52 43.52 0 0 1-43.52 43.52H131.657143a43.52 43.52 0 0 1-43.52-43.52V43.885714C88.137143 19.858286 107.629714 0.365714 131.657143 0.365714h532.736z m-20.004572 87.04H175.177143v839.424h654.116571V303.140571L644.388571 87.405714z"></path><path d="M502.235429 255.158857a274.285714 274.285714 0 0 1 188.891428 75.081143 275.126857 275.126857 0 1 1-188.891428-75.081143z m0 87.04a188.086857 188.086857 0 1 0 0 376.173714 188.086857 188.086857 0 0 0 0-376.173714z"></path><path d="M309.357714 337.371429a43.52 43.52 0 0 1 61.513143 0l324.278857 324.278857a43.52 43.52 0 1 1-61.549714 61.549714L309.394286 398.921143a43.52 43.52 0 0 1 0-61.549714z"></path></svg>
                <p>播放列表为空</p>
                <span>&nbsp搜索歌曲并点击「添加」</span>
              </div>

              <div
                  v-else
                  class="playlist-item"
                  v-for="(audio, index) in playlist"
                  :key="index"
                  :class="{ playing: index === playingIndex }"
              >
                <img
                    :src="audio.tlink || ''"
                    alt="封面"
                    class="playlist-cover"
                    loading="lazy"
                    @error="(e) => e.target.src = '/images/ui/cover.png'"
                />
                <div class="playlist-info">
                  <div class="playlist-name">{{ audio.title }}</div>
                  <div class="playlist-artist">{{ audio.author }}</div>
                </div>
                <div class="playlist-actions">
                  <button class="btn-play" @click="handlePlayClick(index)" :aria-label="index === playingIndex ? '正在播放' : '播放'">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                  <button class="btn-delete" @click="removeFromPlaylist(index)" aria-label="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="modal-footer" v-if="playlist.length > 0">
            <button class="btn-clear" @click="clearPlaylist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              清空列表
            </button>
            <span class="footer-hint">共 {{ playlist.length }} 首</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

// ====== 常量 ======
const STORAGE_KEY = 'music-list'
const API_BASE = 'https://metingapi.nanorocky.top'
const PAGE_SIZE = 5

// ====== Props & Emits ======
const props = defineProps({
  currentIndex: { type: Number, required: true }
})
const emit = defineEmits(['close', 'switch-index', 'list-changed'])

// ====== 状态 ======
const showModal = ref(true)
const playlist = ref([])
const playingIndex = ref(props.currentIndex)

// 搜索
const selectedServer = ref('netease')
const searchKeyword = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)

const displayedCount = ref(PAGE_SIZE)
const displayedResults = computed(() => searchResults.value.slice(0, displayedCount.value))

// 下拉菜单
const dropdownOpen = ref(false)
const dropdownRef = ref(null)

// ====== 平台选项 ======
const platformOptions = [
  { value: 'netease', label: '网易云音乐', icon: '<svg class="icon" viewBox="67 67 890 890" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="512" cy="512" r="300" fill="#ffffff" /><path d="M512 62c248.55 0 450 201.45 450 450 0 248.52-201.45 450-450 450-248.52 0-450-201.48-450-450C62 263.42 263.48 62 512 62z m76.95 162.72c-48.6 16.08-71.94 61.35-57.99 112.8l5.01 18.93c-10.5 2.28-20.82 5.34-30.87 9.21-47.49 18.3-85.17 58.89-98.34 105.96a144.09 144.09 0 0 0-4.77 51.6 129.3 129.3 0 0 0 53.94 94.29 113.91 113.91 0 0 0 96.81 16.5 113.4 113.4 0 0 0 59.7-39.9c23.19-30.27 30.09-70.08 19.5-112.05-3.9-15.3-8.76-32.22-13.5-48.66l-5.04-17.79c20.1 5.04 38.61 15.03 53.85 29.1 52.5 49.02 62.61 133.47 23.52 196.44-34.32 55.32-101.19 91.02-170.31 91.02a211.65 211.65 0 0 1-211.44-211.38c0-27.18 5.34-54.09 15.78-79.17a207.81 207.81 0 0 1 39.24-61.5 209.73 209.73 0 0 1 76.32-52.89A29.73 29.73 0 0 0 418.31 272a280.8 280.8 0 0 0-24.09 11.07 271.41 271.41 0 0 0-93.75 81.03 268.65 268.65 0 0 0-50.91 156.69c0 149.34 121.5 270.84 270.9 270.84 89.25 0 175.92-46.74 220.83-119.13 54.66-88.02 40.53-202.11-33.48-271.26-30.3-28.32-69.72-44.88-111.36-48.54-2.16-8.4-5.52-21.18-8.1-30.78-1.95-7.11-2.91-15.15-0.81-22.32a29.82 29.82 0 0 1 36-20.1c4.14 1.11 8.07 3.06 11.49 5.67 3.6 2.7 6.42 6.21 9.72 9.27a29.76 29.76 0 0 0 46.74-35.31l-0.6-0.99a61.23 61.23 0 0 0-13.5-15.42 94.2 94.2 0 0 0-50.04-21.93 90.12 90.12 0 0 0-38.4 3.96z m-37.71 189.3c3.15 11.64 6.6 23.76 10.08 35.79 4.62 16.2 9.27 32.28 12.96 46.8 4.29 17.04 6.21 41.43-9.06 61.38a53.49 53.49 0 0 1-28.35 18.69 54.81 54.81 0 0 1-47.01-8.01 69.3 69.3 0 0 1-28.62-50.58 84 84 0 0 1 2.76-30.39c8.25-29.4 32.16-54.87 62.46-66.57 8.13-3.15 16.44-5.49 24.78-7.11z" fill="#DD001B" /></svg>' },
  { value: 'tencent', label: 'QQ音乐', icon: '<svg  class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M26.815226 538.816181A485.183819 485.183819 0 1 0 511.999044 53.508885 485.183819 485.183819 0 0 0 26.815226 538.816181z m0 0" fill="#F8C913"></path><path d="M659.883797 12.349756c-18.151176 20.78536-57.170031 38.977696-109.030534 51.901662-88.121696 20.78536-106.272872 25.930252-132.244283 41.488403a190.896043 190.896043 0 0 0-43.793314 30.869347C354.030305 154.883821 338.513314 188.593148 343.740523 199.006408c2.510707 5.144891 51.901662 75.19773 111.541241 160.808719 59.639579 82.976805 116.686132 166.077088 129.733576 184.228264a275.766168 275.766168 0 0 1 20.579565 34.285555c0 2.510707-10.41326 0-20.579565-2.634185-41.61188-13.006285-114.298903 0-166.077087 25.930252a268.522161 268.522161 0 0 0-101.251459 100.592912 181.635239 181.635239 0 0 0-7.902553 137.14222 192.130817 192.130817 0 0 0 93.266588 98.781911c34.285555 18.151176 41.488403 18.151176 85.610989 20.579565a228.638964 228.638964 0 0 0 77.831914-5.144892c96.024249-28.564436 165.95361-103.762166 171.427774-192.007339 2.634184-49.390955-2.634184-64.825629-67.418654-179.001054-101.374936-176.119915-192.213135-336.928634-192.213135-339.727455 0 0 18.192335-2.510707 41.488403-5.144891a171.427774 171.427774 0 0 0 150.518937-90.550085c13.129762-23.419545 13.129762-31.19862 13.129762-80.466098a238.31136 238.31136 0 0 0-5.144891-62.314922c-2.634184-7.779075-5.268369-5.144891-18.151176 7.779075z m0 0" fill="#02B053"></path></svg>' }
]

const currentPlatformIcon = computed(() => {
  const found = platformOptions.find(p => p.value === selectedServer.value)
  return found ? found.icon : ''
})

const currentPlatformLabel = computed(() => {
  const found = platformOptions.find(p => p.value === selectedServer.value)
  return found ? found.label : '网易云音乐'
})

// ====== 核心方法 ======

const loadPlaylist = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        playlist.value = parsed
        return
      }
    }
    playlist.value = []
  } catch { playlist.value = [] }
}

const savePlaylist = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

const notifyListChanged = () => {
  emit('list-changed')
}

// 下拉
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

// ====== 切换平台时也重置 ======
const selectPlatform = (val) => {
  selectedServer.value = val
  dropdownOpen.value = false
  hasSearched.value = false
  searchResults.value = []
  if (searchKeyword.value.trim()) {
    handleSearch()
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    closeDropdown()
  }
}

// 搜索
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  hasSearched.value = true
  isSearching.value = true
  searchResults.value = []

  try {
    const url = `${API_BASE}/?server=${selectedServer.value}&type=search&id=0&keyword=${encodeURIComponent(keyword)}&br=exhigh`
    const res = await fetch(url)
    if (!res.ok) throw new Error('搜索失败')
    const data = await res.json()
    if (Array.isArray(data)) {
      // 1. 标准化数据
      let results = data.map(item => ({
        id: item.id,
        name: item.name || item.title || '未知歌曲',
        artist: item.artist || item.author || '未知歌手',
        pic: item.pic || item.cover || item.tlink || '',
        url: item.url || item.flink || ''
      }))

      // 2. 按 name + artist 分组去重，保留最佳项
      const bestMap = new Map()  // key: name|||artist, value: 最佳项
      const order = []           // 记录首次出现的键，保持顺序

      // 判断封面是否有效（非空且不是常见占位符）
      const isPicValid = (pic) => {
        if (!pic || pic.trim() === '') return false
        const lower = pic.toLowerCase()
        if (lower.includes('cover.png') || lower.includes('default') || lower.includes('placeholder')) {
          return false
        }
        return true
      }

      for (const item of results) {
        const key = `${item.name}|||${item.artist}`
        if (!bestMap.has(key)) {
          // 首次出现，直接添加
          bestMap.set(key, item)
          order.push(key)
        } else {
          const existing = bestMap.get(key)
          const existingValid = isPicValid(existing.pic)
          const currentValid = isPicValid(item.pic)
          // 如果当前项封面有效而旧项无效，则替换
          if (!existingValid && currentValid) {
            bestMap.set(key, item)
          }
          // 如果都有效或都无效，保留旧的（即先出现的）
        }
      }

      // 3. 按原顺序输出保留的项
      const finalResults = []
      for (const key of order) {
        finalResults.push(bestMap.get(key))
      }
      searchResults.value = finalResults
      displayedCount.value = PAGE_SIZE
    } else {
      searchResults.value = []
    }
  } catch (err) {
    console.error('搜索失败:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const onSearchInput = () => {
  hasSearched.value = false
  searchResults.value = []
  displayedCount.value = PAGE_SIZE
}

// ====== 清空搜索 ======
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  displayedCount.value = PAGE_SIZE
}

// ====== 滚动加载 ======
const loadMore = () => {
  if (displayedCount.value < searchResults.value.length) {
    displayedCount.value = Math.min(displayedCount.value + PAGE_SIZE, searchResults.value.length)
  }
}

const onSearchScroll = (e) => {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
    loadMore()
  }
}

// 添加歌曲
const addToPlaylist = async (item) => {
  const exists = playlist.value.some(
      p => p.title === item.name && p.author === item.artist
  )
  if (exists) {
    alert('该歌曲已在播放列表中')
    return
  }

  const newMusic = {
    title: item.name,
    author: item.artist,
    tlink: item.pic || '',
    flink: item.url || ''
  }

  if (!newMusic.flink && item.id) {
    try {
      const url = `${API_BASE}/?server=${selectedServer.value}&type=url&id=${item.id}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        newMusic.flink = data.url || data.flink || ''
      }
    } catch {}
  }

  if (!newMusic.flink) {
    alert('无法获取该歌曲的播放链接，可能不可用')
    return
  }

  const newList = [...playlist.value, newMusic]
  playlist.value = newList
  savePlaylist(newList)
  notifyListChanged()
}

// 删除
const removeFromPlaylist = (index) => {
  const newList = [...playlist.value]
  newList.splice(index, 1)
  playlist.value = newList
  savePlaylist(newList)
  notifyListChanged()

  if (index === playingIndex.value) {
    playingIndex.value = newList.length > 0 ? 0 : -1
  } else if (index < playingIndex.value) {
    playingIndex.value--
  }
}

// 清空
const clearPlaylist = () => {
  if (playlist.value.length === 0) return
  if (confirm('确定要清空播放列表吗？')) {
    playlist.value = []
    savePlaylist([])
    playingIndex.value = -1
    notifyListChanged()
  }
}

// 播放
const handlePlayClick = (index) => {
  playingIndex.value = index
  emit('switch-index', index)
}

// 关闭
const closeModal = () => {
  showModal.value = false
}

const onAfterLeave = () => {
  emit('close')
}

// ====== 生命周期 ======
onMounted(() => {
  loadPlaylist()
  playingIndex.value = props.currentIndex
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

watch(
    () => props.currentIndex,
    (val) => { playingIndex.value = val }
)
</script>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
/* ============================================================
   遮罩
   ============================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 9999;
}

/* ============================================================
   主窗口 — 液态玻璃
   ============================================================ */
.modal-window {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 760px;
  max-height: 92vh;
  background: var(--vp-c-bg-elv);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  -webkit-backdrop-filter: var(--zm-backdrop-blur-medium);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
  color: var(--vp-c-text-1);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

/* ============================================================
   关闭按钮
   ============================================================ */
.btn-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: var(--vp-c-bg-elv);   /* 统一玻璃背景 */
  color: var(--vp-c-text-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  z-index: 10;
  padding: 0;
  box-shadow: 0 8px 32px var(--zm-light-dark-low);
}

.btn-close svg {
  width: 18px;
  height: 18px;
}

@media (min-width: 960px){
  .btn-close:hover {
    transform: scale(1.1);
  }
}

.btn-close:active {
  transform: scale(0.9);
}

/* ============================================================
   顶部标题
   ============================================================ */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 28px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  text-shadow: 0 0 32px var(--vp-c-text-2);
}

.modal-title {
  flex: 1;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--vp-c-text-1);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ============================================================
   搜索区域
   ============================================================ */
.search-section {
  padding: 12px 32px 12px 28px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.search-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ---- 自定义下拉 ---- */
.dropdown-wrap {
  position: relative;
  flex-shrink: 0;
  z-index: 50;
}

.platform-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.platform-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 16px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: var(--vp-c-text-1);   /* 统一玻璃背景 */
  color: var(--vp-c-bg-elv);
  font-size: 13px;
  font-weight: 1000;
  transition: all 0.25s ease;
  white-space: nowrap;
  user-select: none;
  box-shadow: 0 0 32px var(--zm-light-dark-high);
}
@media (min-width: 960px){
  .dropdown-trigger:hover {
    transform: scale(1.06);
  }
}

.dropdown-trigger:active {
  transform: scale(0.9);
}

.dropdown-trigger:focus-visible {
  outline: 2px solid rgba(255, 205, 123, 0.5);
  outline-offset: 2px;
}

.dropdown-label {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  color: var(--vp-c-bg-elv);
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* ---- 下拉菜单 ---- */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  width: max-content;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  background: var(--vp-c-text-1);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  transform: translateY(-6px) scale(0.98);
  transition: all 0.28s cubic-bezier(0.34, 1.0, 0.64, 1);
  visibility: hidden;
  padding: 4px;
  gap: 4px;
  display: flex;
  flex-direction: column;
}

.dropdown-menu.open {
  max-height: 260px;
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
  overflow-y: auto;
}

.dropdown-menu::-webkit-scrollbar {
  width: 3px;
}
.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 800;
  color: var(--vp-c-bg-elv);
  cursor: pointer;
  transition: all 0.15s ease;
  border-left: 2px solid transparent;
  border-radius: 50px;
}

.dropdown-item.active {
  background: rgba(255, 205, 123, 0.1);
}

@media (min-width: 960px){
  .dropdown-item:hover{
    background: rgba(255, 205, 123, 0.06);
    transform: scale(1.03);
  }
}

.dropdown-item:active {
  transform: scale(0.9);
}

.item-label {
  flex: 1;
}

.item-check {
  width: 18px;
  height: 18px;
  color: #ffcd7b;
  flex-shrink: 0;
}

/* ---- 搜索输入 ---- */
.search-input-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 120px;
  border-radius: 50px;
}

.search-input-wrap .search-icon {
  position: absolute;
  left: 12px;
  width: 17px;
  height: 17px;
  fill: none;
  color: var(--vp-c-text-1);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 36px 0 38px;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: var(--zm-background-medium);   /* 统一玻璃背景 */
  color: var(--vp-c-text-1);
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
  box-shadow: 0 8px 32px var(--zm-light-dark-verylow);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.search-input:focus {
  border-color: rgba(255, 205, 123, 1);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 3px rgba(255, 205, 123, 0.06);
}

/* ---- 搜索清除按钮 ---- */
.search-clear {
  position: absolute;
  right: 15px;
  fill: none;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  transform: scale(1.3);
}

@media (min-width: 960px){
  .search-clear:hover {
    transform: scale(1.5);
  }
}

.search-clear svg {
  width: 14px;
  height: 14px;
}

/* ---- 搜索按钮 ---- */
.btn-search {
  flex-shrink: 0;
  height: 42px;
  padding: 0 22px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 205, 123, 1);   /* 统一玻璃背景 */
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 0 16px rgba(255, 205, 123, 0.5);
}

@media (min-width: 960px) {
  .btn-search:hover:not(:disabled) {
    transform: scale(1.06);
  }
}


.btn-search:active:not(:disabled) {
  transform: scale(0.9);
}

.btn-search:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ---- 搜索结果列表 ---- */
.search-results {
  margin-top: 14px;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.search-results::-webkit-scrollbar {
  width: 10px;
}

.search-results::-webkit-scrollbar-thumb {
  background: var(--zm-light-dark-low);
  border-radius: 50px;
}

@media (min-width: 960px){
  .search-results::-webkit-scrollbar-thumb:hover {
    background: var(--zm-light-dark-medium);
  }
}

.search-results::-webkit-scrollbar-thumb:active {
  background: var(--zm-light-dark-high);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  border-radius: 20px;
  background: var(--zm-ghost-light-dark);
  cursor: default;
  transition: all 0.2s ease;
}

.result-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-artist {
  font-size: 12px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 14px 4px 10px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background:#fff;   /* 统一玻璃背景 */
  color: #000000;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  filter: drop-shadow(0 0 8px var(--zm-light-dark-low));
}

.btn-add svg {
  width: 16px;
  height: 16px;
}

@media (min-width: 960px){
  .btn-add:hover {
    background: rgba(255, 205, 123);
    filter: drop-shadow(0 0 8px rgba(255, 205, 123));
    transform: scale(1.06);
  }
}

.btn-add:active {
  transform: scale(0.9);
}

.search-status {
  margin-top: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  font-size: 13px;
  padding: 10px 0;
}

/* ============================================================
   播放列表
   ============================================================ */
.playlist-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px 28px 8px;
}

.playlist-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-bottom: 10px;
}

.playlist-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: 0.2px;
}

.playlist-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
  min-height: 0;
}

.playlist-scroll::-webkit-scrollbar {
  width: 8px;
}

.playlist-scroll::-webkit-scrollbar-thumb {
  background: var(--zm-light-dark-low);
  border-radius: 50px;
}

@media (min-width: 960px){
  .playlist-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--zm-light-dark-medium);
  }
}

.playlist-scroll::-webkit-scrollbar-thumb:active {
  background: var(--zm-light-dark-high);
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 30px;
  color: var(--vp-c-text-1);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  fill: var(--vp-c-text-1);
  margin-bottom: 12px;
  filter: drop-shadow(0 10px 16px var(--zm-light-dark-high));
}

.empty-state p {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--vp-c-text-1);
}

.empty-state span {
  font-size: 13px;
  color: var(--vp-c-text-1);
  margin-top: 4px;
}

/* ---- 列表项 ---- */
.playlist-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.01);
  border: 3px solid transparent;
  transition: all 0.25s ease;
}

@media (min-width: 960px){
  .playlist-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.playlist-item.playing {
  border-color: #ffcd7b;
  background: rgba(255, 205, 123, 0.06);
}

.playlist-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-item.playing .playlist-name {
  color: #ffcd7b;
}

.playlist-artist {
  font-size: 12px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  background: var(--zm-background-low);
  border-radius: 50px;
  padding: 2px;
  box-shadow: 0 0 32px var(--zm-light-dark-verylow);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.25s ease;
}

@media (min-width: 960px){
  .playlist-actions:hover {
    transform: scale(1.1);
  }
}

/* 播放 / 删除按钮统一玻璃背景 */
.playlist-actions button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: var(--zm-background-medium);   /* 统一玻璃背景 */
  color: var(--vp-c-text-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.playlist-actions button svg {
  width: 18px;
  height: 18px;
}

.btn-play {
  color: var(--vp-c-text-1);
}

@media (min-width: 960px){
  .btn-play:hover {
    color: #ffcd7b;
    background: rgba(255, 205, 123, 0.15);
  }
}

.playlist-item.playing .btn-play {
  color: #ffcd7b;
}

@media (min-width: 960px){
  .btn-delete:hover {
    color: #ff6b6b;
    background: rgba(255, 70, 70, 0.15);
  }
}

/* ============================================================
   底部
   ============================================================ */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 44px 20px 28px;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  margin-top: 4px;
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px 6px 14px;
  background: rgb(255, 99, 71);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(255, 99, 71, 0.5);
  font-size: 12px;
  font-weight: 1000;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear svg {
  width: 16px;
  height: 16px;
}

@media (min-width: 960px){
  .btn-clear:hover {
    transform: scale(1.06);
  }
}

.btn-clear:active {
  transform: scale(0.9);
}

.footer-hint {
  font-size: 13px;
  color: var(--vp-c-text-1);
  letter-spacing: 0.2px;
  font-weight: 1000;
}

/* ============================================================
   响应式（仅调整尺寸，背景已统一）
   ============================================================ */
@media (max-width: 768px) {
  .modal-window {
    width: 94%;
    max-height: 96vh;
    border-radius: 20px;
  }

  .modal-header {
    padding: 16px 18px 10px;
  }
  .modal-title {
    font-size: 18px;
  }

  .search-section {
    padding: 12px 16px 10px;
  }
  .search-row {
    gap: 8px;
    flex-wrap: wrap;
  }

  .dropdown-wrap {
    flex: 0 0 auto;
  }
  .dropdown-trigger {
    height: 38px;
    padding: 0 12px 0 14px;
    font-size: 12px;
  }

  .search-input-wrap {
    flex: 1 1 100%;
    order: 3;
  }
  .search-input {
    height: 38px;
    font-size: 13px;
    padding: 0 32px 0 34px;
  }
  .search-input-wrap .search-icon {
    left: 10px;
    width: 15px;
    height: 15px;
  }
  .search-clear {
    right: 4px;
    width: 26px;
    height: 26px;
  }
  .search-clear svg {
    width: 13px;
    height: 13px;
  }

  .btn-search {
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
  }

  .search-results {
    max-height: 140px;
    margin-top: 10px;
  }
  .result-item {
    padding: 6px 10px;
    gap: 10px;
  }
  .result-cover {
    width: 34px;
    height: 34px;
  }
  .result-title {
    font-size: 13px;
  }
  .result-artist {
    font-size: 11px;
  }
  .btn-add {
    padding: 2px 10px 2px 8px;
    font-size: 11px;
  }
  .btn-add svg {
    width: 14px;
    height: 14px;
  }

  .playlist-section {
    padding: 10px 16px 6px;
  }
  .playlist-title {
    font-size: 13px;
  }
  .playlist-item {
    padding: 6px 10px;
    gap: 10px;
  }
  .playlist-cover {
    width: 34px;
    height: 34px;
  }
  .playlist-name {
    font-size: 13px;
  }
  .playlist-artist {
    font-size: 11px;
  }
  .playlist-actions button {
    width: 28px;
    height: 28px;
  }
  .playlist-actions button svg {
    width: 16px;
    height: 16px;
  }

  .modal-footer {
    padding: 10px 16px 16px;
  }
  .btn-clear {
    font-size: 11px;
    padding: 4px 12px;
  }
  .btn-clear svg {
    width: 14px;
    height: 14px;
  }
  .footer-hint {
    font-size: 11px;
  }

  .dropdown-menu {
    min-width: 140px;
  }
  .dropdown-item {
    font-size: 12px;
    padding: 8px 14px;
  }
}
</style>

<style>
/* ===== 过渡动画（全局，强制生效） ===== */

/* 遮罩 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.5s ease !important;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0 !important;
}

.modal-3d-leave-to,
.modal-3d-enter-from{
  transform: translate(-50%) perspective(500px) translateY(20vh) translateZ(500px) rotateX(90deg) !important;
  opacity: 0 !important;
}


.modal-3d-enter-active,
.modal-3d-leave-active{
  transition: all 0.7s cubic-bezier(0.29, 0.00, 0.00, 1.00) !important;
}
</style>