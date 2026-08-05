<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import BGMusicEd from './BGMusicEd.vue'

// 音乐数据类型定义（移除 maincolor）
type Music = {
  title: string
  author: string
  tlink: string
  flink: string
}

// 播放模式类型定义
type PlayMode = 'list' | 'single' | 'random'

// 状态管理：播放列表和当前索引
const musicList = ref<Music[]>([])
const currentIndex = ref(0)
const showMusicEd = ref(false) // 控制BGMusicEd组件显示

// 状态管理：链接有效性
const isCoverValid = ref<boolean | null>(null)
const isAudioValid = ref<boolean | null>(null)

// 折叠状态管理
const isExpanded = ref(false)

// 音频控制状态
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
// 播放模式状态
const playMode = ref<PlayMode>('list')

// 用于跟踪是否需要监听用户交互
const needUserInteraction = ref(false)
// 用于标记是否是首次加载完成
const isFirstLoadCompleted = ref(false)

// 移动端控制按钮显示状态管理
const lastInteractionTime = ref(Date.now())
const areControlsVisible = ref(true)
const interactionTimer = ref<NodeJS.Timeout | null>(null)
const MOBILE_INACTIVITY_TIMEOUT = 5000 // 5秒无交互隐藏按钮

// ============= 从 localStorage 读取播放列表 =============
const STORAGE_KEY = 'music-list'

// 添加一个标志，防止重复展开
let hasExpandedOnEntrance = false
let entranceHandler: (() => void) | null = null

// 刷新列表（从 localStorage 读取）
// 原同步函数 → 改为 async
const refreshMusicList = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        musicList.value = parsed
        if (currentIndex.value >= musicList.value.length) {
          currentIndex.value = 0
        }
        if (musicList.value.length > 0) {
          loadMusic(currentIndex.value)
        }
        return
      }
    }
    // ----- 无数据或空数组 → 加载默认数据 -----
    let defaultData = null
    try {
      const response = await fetch('/data/default-music.json')
      if (response.ok) {
        defaultData = await response.json()
        if (Array.isArray(defaultData) && defaultData.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
          musicList.value = defaultData
          currentIndex.value = 0
          loadMusic(0)
          // 尝试自动播放（浏览器可能阻止，但会进入交互等待）
          tryAutoPlay()
          return
        }
      }
    } catch (fetchErr) {
      console.warn('加载默认音乐失败:', fetchErr)
    }
    // 默认数据也失败 → 清空
    musicList.value = []
    currentIndex.value = 0
    if (audioRef.value) {
      audioRef.value.src = ''
      audioRef.value.load()
    }
    isAudioValid.value = null
    isCoverValid.value = null
  } catch (e) {
    console.error('读取 localStorage 失败:', e)
    musicList.value = []
  }
}

// 保存列表到 localStorage（供子组件调用，但子组件自己操作后通知父组件刷新即可，此方法供内部使用）

// 初始化加载数据
onMounted(async () => {
  // ---------- 原有逻辑（不动） ----------
  const audio = new Audio()
  audioRef.value = audio
  setupAudioEvents(audio)

  // 读取本地播放列表
  await refreshMusicList()

  // 监听窗口大小变化
  const handleResize = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      isExpanded.value = false;
      // 移动端保持原有逻辑，不额外干预
    } else {
      // 宽屏：强制显示控制按钮
      areControlsVisible.value = true;
      // 清除可能遗留的隐藏定时器
      if (interactionTimer.value) {
        clearTimeout(interactionTimer.value);
        interactionTimer.value = null;
      }
    }
  };

  window.addEventListener('resize', handleResize)
  handleResize()  // 此时移动端会被折叠

  // 启动交互检查计时器
  startInteractionTimer()

  // 尝试自动播放（如果有歌曲且未播放）
  if (musicList.value.length > 0 && !isPlaying.value) {
    setTimeout(tryAutoPlay, 1000)
  }

  // ---------- 新增：展开控制 ----------
  // 检查是否已经加载完成（类已存在）
  if (document.documentElement.classList.contains('entrance-done')) {
    // 如果已经完成，直接展开（但通常不会，因为 onMounted 比 dismiss 早）
    expandPlayer()
  } else {
    // 否则监听 entrance-done 事件
    entranceHandler = () => {
      expandPlayer()
      window.removeEventListener('entrance-done', entranceHandler!)
    }
    window.addEventListener('entrance-done', entranceHandler)
  }
})

const expandPlayer = () => {
  if (hasExpandedOnEntrance) return
  hasExpandedOnEntrance = true

  // 延迟展开，等待加载动画淡出（约 600ms）
  setTimeout(() => {
    isExpanded.value = true
    areControlsVisible.value = true
    if (interactionTimer.value) {
      clearTimeout(interactionTimer.value)
      interactionTimer.value = null
    }
  }, 300) // 可调整为 500~800，视觉上平滑
}

// 跟踪用户交互
const trackInteraction = () => {
  if (window.innerWidth > 768 || isExpanded.value) return
  lastInteractionTime.value = Date.now()
  areControlsVisible.value = true
  if (interactionTimer.value) {
    clearTimeout(interactionTimer.value)
  }
  startInteractionTimer()
}

// 启动交互检查计时器
const startInteractionTimer = () => {
  if (window.innerWidth > 768) return
  interactionTimer.value = setTimeout(() => {
    const now = Date.now()
    if (now - lastInteractionTime.value >= MOBILE_INACTIVITY_TIMEOUT && !isExpanded.value) {
      areControlsVisible.value = false
    }
  }, MOBILE_INACTIVITY_TIMEOUT)
}

// 尝试自动播放函数
const tryAutoPlay = async () => {
  if (!audioRef.value || isPlaying.value) return
  try {
    await audioRef.value.play()
    isPlaying.value = true
    stopListeningUserInteraction()
  } catch (error) {
    console.log('自动播放失败，等待用户交互:', error)
    isPlaying.value = false
    startListeningUserInteraction()
  }
}

// 开始监听用户交互
const startListeningUserInteraction = () => {
  if (needUserInteraction.value) return
  needUserInteraction.value = true
  document.addEventListener('click', handleUserInteraction)
  document.addEventListener('touchstart', handleUserInteraction)
  document.addEventListener('keydown', handleUserInteraction)
}

// 停止监听用户交互
const stopListeningUserInteraction = () => {
  if (!needUserInteraction.value) return
  needUserInteraction.value = false
  document.removeEventListener('click', handleUserInteraction)
  document.removeEventListener('touchstart', handleUserInteraction)
  document.removeEventListener('keydown', handleUserInteraction)
}

// 处理用户交互，再次尝试播放
const handleUserInteraction = (e: Event) => {
  trackInteraction()
  if (!isPlaying.value) {
    console.log(`用户通过${e.type}交互触发播放尝试`)
    tryAutoPlay()
  }
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  // 移除 entrance-done 监听
  if (entranceHandler) {
    window.removeEventListener('entrance-done', entranceHandler)
    entranceHandler = null
  }

  // 原有清理逻辑
  stopListeningUserInteraction()
  if (interactionTimer.value) {
    clearTimeout(interactionTimer.value)
  }
  if (audioRef.value) {
    audioRef.value.src = ''
    audioRef.value.load()
  }
})

// 设置音频事件监听
const setupAudioEvents = (audio: HTMLAudioElement) => {
  audio.addEventListener('loadedmetadata', () => {
    isAudioValid.value = true
    duration.value = audio.duration
    if (!isFirstLoadCompleted.value) {
      currentTime.value = 0
      progress.value = 0
      isFirstLoadCompleted.value = true
    }
  })

  audio.addEventListener('error', () => {
    isAudioValid.value = false
  })

  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
    progress.value = (audio.currentTime / audio.duration) * 100
  })

  audio.addEventListener('ended', () => {
    if (playMode.value === 'single') {
      // 单曲循环：重置时间并重播
      audio.currentTime = 0
      audio.play()
          .then(() => { isPlaying.value = true })
          .catch(() => { isPlaying.value = false })
    } else {
      // 其他模式：自动切换到下一首并播放
      nextTrack()
      // nextTrack 内部会根据 isPlaying 状态决定是否播放，由于 ended 时 isPlaying 为 true，会自动播放
    }
  })
}

// 加载指定索引的音乐
const loadMusic = (index: number) => {
  if (!audioRef.value || index < 0 || index >= musicList.value.length) return
  const music = musicList.value[index]
  currentIndex.value = index

  // 重置状态
  currentTime.value = 0
  progress.value = 0

  // 检查封面图片
  const coverImg = new Image()
  coverImg.src = music.tlink
  coverImg.onload = () => { isCoverValid.value = true }
  coverImg.onerror = () => { isCoverValid.value = false }

  // 加载音频
  audioRef.value.src = music.flink
  audioRef.value.load()
}

// 切换折叠状态
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  trackInteraction()
}

// 音频控制方法
const togglePlay = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    stopListeningUserInteraction()
  }
  trackInteraction()
}

const setProgress = (e: MouseEvent) => {
  if (!audioRef.value || !audioRef.value.duration) return
  const progressBar = e.currentTarget as HTMLDivElement
  const rect = progressBar.getBoundingClientRect()
  const pos = (e.clientX - rect.left) / rect.width
  const newTime = pos * audioRef.value.duration
  audioRef.value.currentTime = newTime
  currentTime.value = newTime
  progress.value = pos * 100
  trackInteraction()
}

// 格式化时间
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 切换播放模式
const togglePlayMode = () => {
  switch (playMode.value) {
    case 'list': playMode.value = 'single'; break
    case 'single': playMode.value = 'random'; break
    case 'random': playMode.value = 'list'; break
  }
  trackInteraction()
}

// 上一首
const prevTrack = () => {
  if (musicList.value.length === 0) return
  let newIndex = currentIndex.value
  // 在 prevTrack 函数内
  switch (playMode.value) {
    case 'single':
    case 'list':
      newIndex = currentIndex.value === 0 ? musicList.value.length - 1 : currentIndex.value - 1
      break
    case 'random':
      if (musicList.value.length > 1) {
        do {
          newIndex = Math.floor(Math.random() * musicList.value.length)
        } while (newIndex === currentIndex.value)
      }
      break
  }
  loadMusic(newIndex)
  if (isPlaying.value) {
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  }
  trackInteraction()
}

// 下一首
const nextTrack = () => {
  if (musicList.value.length === 0) return
  let newIndex = currentIndex.value
  // 在 nextTrack 函数内
  switch (playMode.value) {
    case 'single':
    case 'list':
      newIndex = currentIndex.value === musicList.value.length - 1 ? 0 : currentIndex.value + 1
      break
    case 'random':
      if (musicList.value.length > 1) {
        do {
          newIndex = Math.floor(Math.random() * musicList.value.length)
        } while (newIndex === currentIndex.value)
      }
      break
  }
  loadMusic(newIndex)
  if (isPlaying.value) {
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  }
  trackInteraction()
}

// 子组件切换音频（通过 switch-index 事件）
const handleSwitchAudio = (newIndex: number) => {
  if (newIndex === currentIndex.value && musicList.value.length > 0) {
    // 同一首歌：仅恢复播放，不重新加载
    isPlaying.value = true
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  } else {
    // 切歌：加载新歌并播放
    currentIndex.value = newIndex
    loadMusic(newIndex)
    isPlaying.value = true
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  }
  trackInteraction()
}

// 只读取列表，不加载音频
const loadListOnly = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        musicList.value = parsed
        if (currentIndex.value >= musicList.value.length) {
          currentIndex.value = musicList.value.length - 1
        }
        return
      }
    }
    musicList.value = []
    currentIndex.value = 0
  } catch (e) {
    console.error('读取 localStorage 失败:', e)
    musicList.value = []
    currentIndex.value = 0
  }
}

// 监听折叠状态变化
watch(isExpanded, (newVal) => {
  if (!newVal && window.innerWidth <= 768) {
    trackInteraction()
  } else if (newVal && window.innerWidth <= 768) {
    areControlsVisible.value = true
  }
})

// ============= 监听子组件的列表变化事件 =============
const handleListChanged = () => {
  // 记录旧列表长度（用于检测 0→1 场景）
  const oldLength = musicList.value.length
  // 记录当前正在播放的歌曲标识（用于判断当前歌是否被删除）
  const currentMusic = musicList.value[currentIndex.value]
  const currentId = currentMusic ? `${currentMusic.title}|||${currentMusic.author}` : null

  // 从 localStorage 刷新列表数据（只更新 musicList，不加载音频）
  loadListOnly()

  // ========== 场景一：从 0 首变为 1 首 ==========
  if (oldLength === 0 && musicList.value.length === 1) {
    // 设置为第一首（索引 0）
    currentIndex.value = 0
    // 加载音频（异步）
    loadMusic(0)
    // 标记为播放状态（等待播放成功）
    isPlaying.value = true
    // 延迟播放，确保音频元素就绪
    setTimeout(() => {
      audioRef.value?.play().catch(() => {
        // 播放失败时回退为暂停状态（图标变为播放按钮）
        isPlaying.value = false
      })
    }, 100)
    return   // 处理完毕，直接返回
  }

  // ========== 场景二：列表变空 ==========
  if (musicList.value.length === 0) {
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.src = ''
      audioRef.value.load()
    }
    isPlaying.value = false
    isAudioValid.value = null
    isCoverValid.value = null
    return
  }

  // ========== 场景三：列表非空，检查当前歌曲是否还在 ==========
  if (currentId) {
    const foundIndex = musicList.value.findIndex(
        item => `${item.title}|||${item.author}` === currentId
    )
    if (foundIndex !== -1) {
      // 当前歌曲还在，只更新索引，不重新加载（避免闪断）
      currentIndex.value = foundIndex
      return
    }
  }

  // ========== 场景四：当前歌曲被删除，加载新索引的歌曲 ==========
  // loadListOnly 已保证 currentIndex 不越界
  loadMusic(currentIndex.value)
  if (isPlaying.value) {
    setTimeout(() => {
      audioRef.value?.play()
    }, 100)
  }
}
</script>

<template>
  <div class="music-player-wrapper" :class="{ 'collapsed': !isExpanded }" @click="trackInteraction" @touchstart="trackInteraction">
    <!-- 折叠按钮 -->
    <button class="toggle-button" @click="toggleExpand" :aria-label="isExpanded ? '折叠播放器' : '展开播放器'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path v-if="isExpanded" d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path v-if="!isExpanded" d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="music-player">
      <!-- 打开BGMusicEd组件的按钮 - 颜色固定为白色 -->
      <button
          v-if="musicList.length > 0"
          class="open-editor-btn"
          @click="showMusicEd = !showMusicEd"
          aria-label="打开音乐编辑"
          :style="{
            color: '#ffffff',
            opacity: areControlsVisible ? 1 : 0,
            transform: areControlsVisible ? 'translateX(0)' : 'translateX(10px)',
            pointerEvents: areControlsVisible ? 'auto' : 'none'
          }"
      >
        <svg class="icon" style="width:22px; height: 22px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
             width="200" height="200"><path d="M187.392 70.656q28.672 0 48.64 19.456t19.968 48.128l0 52.224q0 28.672-19.968 48.64t-48.64 19.968l-54.272 0q-27.648 0-47.616-19.968t-19.968-48.64l0-52.224q0-28.672 19.968-48.128t47.616-19.456l54.272 0zM889.856 70.656q27.648 0 47.616 19.456t19.968 48.128l0 52.224q0 28.672-19.968 48.64t-47.616 19.968l-437.248 0q-28.672 0-48.64-19.968t-19.968-48.64l0-52.224q0-28.672 19.968-48.128t48.64-19.456l437.248 0zM187.392 389.12q28.672 0 48.64 19.968t19.968 48.64l0 52.224q0 27.648-19.968 47.616t-48.64 19.968l-54.272 0q-27.648 0-47.616-19.968t-19.968-47.616l0-52.224q0-28.672 19.968-48.64t47.616-19.968l54.272 0zM889.856 389.12q27.648 0 47.616 19.968t19.968 48.64l0 52.224q0 27.648-19.968 47.616t-47.616 19.968l-437.248 0q-28.672 0-48.64-19.968t-19.968-47.616l0-52.224q0-28.672 19.968-48.64t48.64-19.968l437.248 0zM187.392 708.608q28.672 0 48.64 19.968t19.968 47.616l0 52.224q0 28.672-19.968 48.64t-48.64 19.968l-54.272 0q-27.648 0-47.616-19.968t-19.968-48.64l0-52.224q0-27.648 19.968-47.616t47.616-19.968l54.272 0zM889.856 708.608q27.648 0 47.616 19.968t19.968 47.616l0 52.224q0 28.672-19.968 48.64t-47.616 19.968l-437.248 0q-28.672 0-48.64-19.968t-19.968-48.64l0-52.224q0-27.648 19.968-47.616t48.64-19.968l437.248 0z" fill="#ffffff"></path></svg>
      </button>

      <!-- 播放模式切换按钮 -->
      <button
          v-if="musicList.length > 0"
          class="play-mode-btn"
          @click="togglePlayMode"
          :aria-label="`当前播放模式: ${playMode === 'list' ? '列表循环' : playMode === 'single' ? '单曲循环' : '随机播放'}`"
          :style="{
            color: '#ffffff',
            opacity: areControlsVisible ? 1 : 0,
            transform: areControlsVisible ? 'translateX(0)' : 'translateX(10px)',
            pointerEvents: areControlsVisible ? 'auto' : 'none'
          }"
      >
        <template v-if="playMode === 'list'">
          <svg class="icon" style="width:20px; height: 20px" viewBox="0 0 1175 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
               width="200" height="200"><path d="M664.313285 190.185527H67.178346a64.722142 64.722142 0 1 1 0-129.444285h597.134939a64.722142 64.722142 0 1 1 0 129.444285z m0 388.007615H67.178346a64.722142 64.722142 0 1 1 0-129.397822h597.134939a64.722142 64.722142 0 1 1 0 129.397822z m0 387.728841H67.178346a64.722142 64.722142 0 1 1 0-129.444284h597.134939a64.722142 64.722142 0 1 1 0 129.444284z m264.835757 57.985092a63.14242 63.14242 0 0 1-31.083355-8.037997 64.582755 64.582755 0 0 1-33.406475-56.684145V66.456119a64.722142 64.722142 0 1 1 129.397821 0v775.504145l79.961814-50.458181a64.722142 64.722142 0 1 1 69.089609 109.511908l-178.880292 113.043053a68.671447 68.671447 0 0 1-35.125585 9.850031z" fill="#ffffff"></path></svg>
        </template>
        <template v-if="playMode === 'single'">
          <svg class="icon" style="width:30px; height: 30px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
               width="200" height="200"><path d="M852.823512 368.339336l-0.140891-0.347143c-5.708255-13.319262-18.689089-21.926672-33.067211-21.926672-4.425713 0-8.832545 0.811938-13.102843 2.414025l-0.424124 0.168488c-17.792908 7.625532-26.362553 27.903637-19.512647 46.168601l0.106031 0.273067c15.264136 37.31427 22.143092 76.881339 20.449498 117.546485-1.665997 34.981583-9.946599 71.039455-23.941265 104.27806l-0.071172 0.167035c-12.588664 31.478196-33.799262 62.6688-61.336874 90.206412-26.995835 26.997288-57.73036 47.669016-93.958173 63.196051-35.132641 15.056431-74.355472 23.016034-113.428698 23.017486-29.810746 0.001452-58.95916-4.430071-86.855534-13.184181l36.771041-39.838684 0.332618-0.377645c12.46375-14.95621 11.442655-36.649033-2.373356-50.463592l-0.663784-0.605685a37.556834 37.556834 0 0 0-23.99646-8.719251c-9.917549 0-19.316562 3.939132-26.468584 11.094059l-79.545192 84.838037c-6.923983 6.983535-10.736749 16.012165-10.736749 25.443132 0 9.446945 3.825838 18.490099 10.771609 25.479444l77.591603 81.11823 0.153963 0.158321c7.458496 7.459949 17.097169 11.738962 26.443892 11.738961 10.932834 0 19.83074-3.358139 26.44825-9.974195 7.000965-6.99806 10.857305-16.078979 10.857305-25.565141 0-7.339393-2.309447-14.434769-6.595722-20.511954a381.488658 381.488658 0 0 0 48.717707 3.099597c52.269027 0 98.796391-10.395416 138.296647-30.898656 44.589753-17.907654 83.032601-43.366763 117.507268-77.81819 31.996732-30.342355 58.257611-68.793918 78.044778-114.285662 17.41381-38.33827 27.200635-81.723915 29.090314-128.997855 1.760409-49.138928-6.774377-98.561089-25.363245-146.890985zM513.485889 214.177226c23.694343 0 46.987801 2.676925 69.46206 7.974127l-32.422309 33.350446c-6.96901 6.99225-10.803563 16.048477-10.803563 25.508493 0 9.19276 3.622491 18.002065 10.21676 24.908619 5.10838 6.958843 13.834894 10.627813 25.321123 10.627812 7.855024 0 16.244562-2.936919 24.928953-8.729418l0.867132-0.576635 80.153782-81.933073 0.531608-0.588255c11.826111-14.193657 11.826111-35.603245 0-49.796902l-0.18737-0.223683-79.442065-84.739268c-6.507121-7.656034-16.580085-12.216828-27.008908-12.216828-9.195665 0-17.771121 3.445288-24.204164 9.712749-7.231909 6.196289-11.625668 15.378882-12.074485 25.270286-0.45027 9.933526 3.058928 19.184386 9.888499 26.070605l2.45179 2.583966a357.61566 357.61566 0 0 0-35.912624-1.806888c-97.127489 0-188.630967 38.015818-257.575943 106.960794-36.920647 36.023013-65.023274 78.556051-83.522088 126.424057-18.376806 47.552817-26.317526 97.852278-23.601385 149.408136 1.83739 42.310809 11.265452 84.409555 27.26745 121.741254l0.245469 0.530156c6.79326 13.586519 19.042043 21.383444 33.60463 21.383444h11.172494l2.098837-1.051597c18.569986-9.282814 26.198423-28.446865 18.985395-47.686446l-0.222229-0.547586c-13.07815-29.421481-20.308607-61.172743-22.098066-96.979336-3.427858-82.274406 27.661072-162.526956 85.295569-220.190502 57.634496-55.863921 129.06467-85.388528 206.583648-85.388527z" fill="#ffffff"></path><path d="M517.015421 367.261594c-19.740687 0-36.418088 16.677401-36.418088 36.418088v199.446151c0 19.742139 16.677401 36.41954 36.418088 36.41954 20.423353 0 36.418088-15.99764 36.418088-36.41954V403.679682c0-19.740687-16.675949-36.418088-36.418088-36.418088z" fill="#ffffff"></path></svg>
        </template>
        <template v-if="playMode === 'random'">
          <svg class="icon" style="width:25px; height: 25px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
               width="200" height="200"><path d="M924.928 222.805333l-82.346667-82.304a42.666667 42.666667 0 1 0-60.288 60.330667l12.458667 12.501333h-83.626667q-64.597333 0-118.357333 35.84t-78.592 95.445334l-125.824 301.952q-14.890667 35.754667-47.146667 57.258666Q308.949333 725.333333 270.208 725.333333H128a42.666667 42.666667 0 1 0 0 85.333334h142.208q64.597333 0 118.357333-35.84t78.549334-95.445334l125.866666-301.952q14.890667-35.754667 47.104-57.258666Q672.341333 298.666667 711.082667 298.666667h83.669333l-12.458667 12.501333a42.666667 42.666667 0 1 0 60.330667 60.330667l82.346667-82.346667Q938.666667 275.498667 938.666667 256t-13.738667-33.194667zM128 213.333333h90.325333q68.864 0 124.714667 40.277334 55.893333 40.277333 77.653333 105.6l3.754667 11.306666a42.666667 42.666667 0 1 1-80.938667 26.965334l-3.754666-11.306667q-13.056-39.168-46.592-63.36Q259.626667 298.666667 218.325333 298.666667H128a42.666667 42.666667 0 0 1 0-85.333334z m666.752 597.333334h-31.744q-68.864 0-124.757333-40.277334-55.893333-40.277333-77.653334-105.6l-3.754666-11.306666a42.666667 42.666667 0 1 1 80.938666-26.965334l3.797334 11.306667q13.056 39.168 46.592 63.36 33.493333 24.149333 74.837333 24.149333h31.744l-12.458667-12.501333a42.666667 42.666667 0 1 1 60.330667-60.330667l82.346667 82.346667Q938.666667 748.501333 938.666667 768t-13.738667 33.194667l-82.304 82.304a42.666667 42.666667 0 1 1-60.330667-60.330667l12.458667-12.501333z"
                                              fill="#ffffff"></path></svg>
        </template>
      </button>

      <!-- BGMusicEd组件 -->
      <BGMusicEd
          class="bg-music-ed"
          v-if="showMusicEd"
          @close="showMusicEd = false"
          :current-index="currentIndex"
          :is-playing="isPlaying"
          @switch-index="handleSwitchAudio"
          @list-changed="handleListChanged"
          @pause="togglePlay"
      />

      <!-- 没有音乐数据时显示 -->
      <div v-if="musicList.length === 0" class="no-music" style="cursor: pointer;" @click="showMusicEd = true">
        <p class="no-music-info">点击任意位置添加歌曲</p>
      </div>

      <!-- 音乐播放器主体 -->
      <template v-if="musicList.length > 0">
        <!-- 背景图容器（暗色毛玻璃） -->
        <div class="bg-wrapper" :style="{ 'background-image': `url(${musicList[currentIndex].tlink})` }">
          <!-- 毛玻璃容器（暗色半透明） -->
          <div class="player-container">
            <!-- 左侧封面区域 -->
            <div class="album-cover">
              <template v-if="isCoverValid === true">
                <img :src="musicList[currentIndex].tlink" alt="专辑封面" class="cover-img" />
              </template>
              <template v-if="isCoverValid === false">
                <div class="invalid-cover">⚠️ 封面链接无效</div>
              </template>
              <template v-if="isCoverValid === null">
                <div class="loading-cover">加载封面中...</div>
              </template>
            </div>

            <!-- 右侧信息与控制区 -->
            <div class="music-info">
              <!-- 歌曲标题（白色） -->
              <h3 class="music-title" style="color: #ffffff;">{{ musicList[currentIndex].title }}</h3>
              <!-- 歌手（白色） -->
              <p class="music-artist" style="color: #ffffff;">{{ musicList[currentIndex].author }}</p>

              <!-- 音频控制区 -->
              <div class="audio-control">
                <template v-if="isAudioValid !== false">
                  <div class="custom-audio-controls">
                    <!-- 上一首按钮 -->
                    <button class="audio-btn prev-btn" @click="prevTrack" aria-label="上一首" style="color: #ffffff;">
                      <svg class="icon" style="width: 35px; height: 35px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M206 865h-38c-30.928 0-56-25.072-56-56V216c0-30.928 25.072-56 56-56h38c30.928 0 56 25.072 56 56v593c0 30.928-25.072 56-56 56z m168.686-386.191l422.304-303.4c32.294-23.201 77.282-15.83 100.484 16.464A72 72 0 0 1 911 233.883v559.053c0 39.764-32.235 72-72 72a72 72 0 0 1-39.95-12.1L376.288 570.877c-25.73-17.16-32.677-51.93-15.517-77.66a56 56 0 0 1 13.915-14.408z" fill="#ffffff"></path></svg>
                    </button>

                    <!-- 播放/暂停按钮 -->
                    <button class="audio-btn play-btn" @click="togglePlay" aria-label="播放/暂停" style="color: #ffffff;">
                      <svg class="icon" v-if="isPlaying" style="width: 32px; height: 32px" viewBox="46.545 46.545 930.909 930.909" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M432 176v672c0 26.5-21.5 48-48 48H224c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48zM848 176v672c0 26.5-21.5 48-48 48H640c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48z" fill="#ffffff"></path></svg>
                      <svg class="icon" v-if="!isPlaying" style="width: 32px; height: 32px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M324.085 95.787l500.422 300.664c82.373 50.453 79.284 136.946-1.030 186.37v0l-506.6 304.784c-41.187 23.683-87.522 37.068-131.798 9.267-36.037-22.653-46.335-58.691-46.335-97.819v-616.774c0-39.127 13.386-75.166 48.395-97.819 45.305-27.801 94.731-14.416 136.946 11.327v0z" fill="#ffffff"></path></svg>
                    </button>

                    <!-- 下一首按钮 -->
                    <button class="audio-btn next-btn" @click="nextTrack" aria-label="下一首" style="color: #ffffff;">
                      <svg class="icon" style="width: 35px; height: 35px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M817 160h38c30.928 0 56 25.072 56 56v593c0 30.928-25.072 56-56 56h-38c-30.928 0-56-25.072-56-56V216c0-30.928 25.072-56 56-56zM648.314 546.191l-422.304 303.4c-32.294 23.201-77.282 15.83-100.484-16.464A72 72 0 0 1 112 791.117V232.064c0-39.764 32.235-72 72-72a72 72 0 0 1 39.95 12.1l422.762 281.959c25.73 17.16 32.677 51.93 15.517 77.66a56 56 0 0 1-13.915 14.408z" fill="#ffffff"></path></svg>
                    </button>
                  </div>

                  <!-- 进度条 -->
                  <div class="progress-container" @click="setProgress">
                    <div class="progress-bar">
                      <div class="progress-filled" :style="{ width: `${progress}%`, backgroundColor: '#ffffff' }"></div>
                    </div>
                    <div class="time-display" style="color: #ffffff;">
                      <span class="current-time">{{ formatTime(currentTime) }}</span>
                      <span class="total-time">{{ formatTime(duration) }}</span>
                    </div>
                  </div>
                </template>

                <template v-if="isAudioValid === false">
                  <div class="invalid-audio">⚠️ 音频链接无效</div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有CSS样式不变，但调整背景色使白色文字清晰 */
.music-player-wrapper {
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 5000;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  pointer-events: none;
}

.toggle-button,
.open-editor-btn,
.play-mode-btn,
.audio-btn,
.progress-container,
.no-music,
.bg-music-ed,
.player-container{
  pointer-events: auto;
}

.music-player-wrapper.collapsed {
  transform: translateX(calc(100% - 40px));
}

.toggle-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--zm-background-medium) !important;
  backdrop-filter: var(--zm-backdrop-blur-medium);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  z-index: 1000;
  transition: all 0.3s ease;
}

.toggle-button svg {
  display: block;
}

.toggle-button:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.music-player {
  width: 450px;          /* 固定宽度 */
  height: 200px;         /* 固定高度 */
  padding: 10px;
  box-sizing: border-box;
}

.player-container {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 10px;
  box-sizing: border-box;
  /* 暗色毛玻璃效果 */
  backdrop-filter: blur(7px);
  background-color: rgba(0, 0, 0, 0.25); /* 暗色半透明背景 */
  border-radius: 30px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-container:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.album-cover {
  overflow: hidden;
  aspect-ratio: 1/1;
  flex-shrink: 0;        /* 防止被压缩 */
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.6); /* 玻璃边缘光晕 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.cover-img {
  width: 100%;
  height: 100%;
  aspect-ratio: 1/1;
  flex-shrink: 0;        /* 防止被压缩 */
  object-fit: cover;
}

.invalid-cover {
  color: #ff4d4f;
  font-size: 16px;
  text-align: center;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
}

.loading-cover {
  color: #ccc;
  text-align: center;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
}

.music-info {
  width: calc(100% - 200px);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.music-title {
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: clamp(1rem, 3vw, 1.5rem);
  padding: 16px;
  margin: -16px;
  flex-shrink: 0;
  overflow: hidden;
  max-width: calc(100% + 32px);
  font-weight: 800;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 0 16px rgb(255 255 255 / 0.6);
}

.music-artist {
  font-size: clamp(0.8rem, 2vw, 1rem);
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 16px;
  margin: -16px;
  flex-shrink: 0;
  overflow: hidden;
  max-width: calc( 100% + 32px);
  text-align: center;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 16px rgb(255 255 255 / 0.6);
}

.audio-control {
  margin-top: auto;
  width: 100%;
}

.invalid-audio {
  color: #ff4d4f;
  text-align: center;
  padding: 10px;
  font-size: 14px;
}

.custom-audio-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
}

.audio-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  transition: transform 0.2s ease, opacity 0.2s ease;
  color: #ffffff;
  filter: drop-shadow(0 0 16px rgb(255, 255, 255, 1));
}

.audio-btn:hover {
  transform: scale(1.1);
  opacity: 0.8;
}

.progress-container {
  width: 100%;
}

.progress-bar {
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 0 16px rgb(255, 255, 255, 0.6);
}

.progress-filled {
  height: 100%;
  border-radius: 3px;
  transition: width 0.1s linear;
  background-color: #ffffff;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: 5px;
  color: #ffffff;
}

.bg-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 35px;
  overflow: hidden;
  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bg-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
  z-index: -1;
}

.bg-wrapper:hover {
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

.no-music {
  display: flex;
  height: 100%;
  width: 100%;
  padding: 20px;
  text-align: center;
  background-color: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  box-shadow: 0 2px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

@media (min-width: 960px) {
  .no-music:hover{
    transform: scale(1.03);
  }
}

.no-music:active{
  transform: scale(0.95);
}

.no-music-info{
  color: var(--vp-c-text-1);
  font-weight: bold;
  margin: auto;
  font-size: 17px
}

/* 打开编辑组件的按钮样式 */
.open-editor-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  transition: all 0.3s ease;
  border: none;
  color: #ffffff;
}

.open-editor-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 播放模式切换按钮样式 */
.play-mode-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  transition: all 0.3s ease;
  border: none;
  color: #ffffff;
}

.play-mode-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}


@media(min-width: 960px) {
  .toggle-button:hover,.open-editor-btn:hover,.play-mode-btn:hover {
    transform: scale(1.1) !important;
  }
}

.toggle-button:active,.open-editor-btn:active,.play-mode-btn:active{
  transform: scale(0.9) !important;
}

/* 移动端样式保持不变 */
@media (max-width: 768px) {
  .music-player-wrapper {
    bottom: 5px;
    right: 5px;
    align-items: center;
  }

  .music-player {
    width: 200px;
    height: 350px;
  }

  .player-container {
    flex-direction: column;
    align-items: center;
    height: 100%;
    width: 100%;
    justify-content: space-between;
  }

  .album-cover {
    margin-bottom: 10px;
    flex-grow: 1;
    min-height: 0;
    overflow: hidden;
  }

  .cover-img {
    max-width: none;
    max-height: none;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .music-info {
    width: 100%;
    padding: 0;
    flex-grow: 1;
    gap: 0;
    justify-content: space-between;
  }

  .music-title {
    font-size: clamp(1rem, 3vw, 1.5rem);
    max-width: 100%;
    display: inline-block;
  }

  .audio-control {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 0;
    flex-grow: 1;
  }

  .custom-audio-controls {
    gap: 10px;
  }

  .time-display {
    font-size: 0.7rem;
  }

  .music-player-wrapper {
    transform: translateX(calc(100% - 40px));
  }

  .music-player-wrapper:not(.collapsed) {
    transform: translateX(0);
  }

  .open-editor-btn {
    top: 56%;
    left: 3px;
    bottom: auto;
    background: rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  }

  .open-editor-btn svg path {
    fill: white !important;
    stroke: #ffffff !important;
  }

  .open-editor-btn:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  .play-mode-btn {
    top: 80%;
    left: 3px;
    bottom: auto;
    background: rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  }

  .play-mode-btn svg path {
    fill: white !important;
    stroke: #ffffff !important;
  }

  .play-mode-btn:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  .toggle-button {
    position: relative;
    align-self: flex-start;
    top: 68%;
    left: 3px;
    height: 35px;
    width: 35px;
    background: rgba(0, 0, 0, 0.5);
  }

  .music-player-wrapper{
    pointer-events: none;
    height: 350px;
  }

  .open-editor-btn svg, .open-editor-btn path {
    pointer-events: none;
  }

  .play-mode-btn svg, .play-mode-btn path {
    pointer-events: none;
  }

  .music-player-wrapper {
    pointer-events: auto;
  }
}
</style>