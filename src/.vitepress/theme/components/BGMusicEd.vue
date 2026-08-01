<!-- emit + 事件监听，适用于父子组件简单通信 -->

<template>
  <ClientOnly>
    <!-- 使用 Teleport 将模态框传送到 body 下，脱离播放器的定位上下文 -->
    <Teleport to="body">
      <div class="audio-info-modal" v-if="showModal">
        <!-- 半透明遮罩层 -->
        <div class="modal-overlay" @click="closeModal"></div>

        <!-- 圆角窗口 -->
        <div class="modal-container" @click="handleContainerClick">
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="closeModal" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- 标题 -->
          <h2 class="modal-title">音频列表</h2>

          <!-- 音频列表 -->
          <div class="audio-list">
            <div
                class="audio-item"
                v-for="(audio, index) in audioList"
                :key="index"
                :class="{ 'alternate-bg': index % 2 === 1 }"
                :style="index === playingIndex ? { border: '5px solid #FFCD7BFF' } : {}"
            >
              <!-- 封面图 -->
              <!-- 新功能：下载 -->
              <div class="audio-cover">
                <div
                    class="cover-wrapper"
                    @click.stop="handleCoverClick(index)"
                    :class="{ 'active': isMobile && activeCoverIndex === index }"
                >
                  <img
                      :src="audio.tlink"
                      :alt="audio.title"
                      :style="index === playingIndex ? { height: '110px' } : {}"
                      class="cover-img"
                  >
                  <!-- 下载图标容器 -->
                  <div class="cover-actions">
                    <button
                        class="download-btn"
                        @click.stop="downloadCover(audio.tlink, audio.title, audio.author)"
                        aria-label="下载封面图"
                        :disabled="isMobile && activeCoverIndex !== index"
                    >
                      <svg t="1759909127460" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2407" width="200" height="200"><path d="M832 0h-640A192 192 0 0 0 0 192v640A192 192 0 0 0 192 1024h640a192 192 0 0 0 192-192v-640A192 192 0 0 0 832 0zM947.2 832a115.456 115.456 0 0 1-115.2 115.2h-640A115.456 115.456 0 0 1 76.8 832V554.24l126.464-117.248A25.6 25.6 0 0 1 236.8 435.2l296.192 236.8a102.4 102.4 0 0 0 136.192-6.4l70.4-70.4a25.6 25.6 0 0 1 35.072 0l172.544 153.6z m0-186.88L825.856 537.6a102.4 102.4 0 0 0-140.544 3.84L614.4 610.816a25.6 25.6 0 0 1-34.048 1.792l-295.68-237.056a102.4 102.4 0 0 0-133.632 5.12L76.8 449.536V192A115.456 115.456 0 0 1 192 76.8h640A115.456 115.456 0 0 1 947.2 192z" fill="#2c2c2c" p-id="2408"></path><path d="M742.4 158.464A123.136 123.136 0 1 0 865.536 281.6 123.392 123.392 0 0 0 742.4 158.464z m0 179.2A56.064 56.064 0 1 1 798.464 281.6 56.064 56.064 0 0 1 742.4 337.664z" fill="#2c2c2c" p-id="2409"></path></svg>
                    </button>
                    <button
                        class="download-btn"
                        @click.stop="downloadAudio(audio)"
                        aria-label="下载歌曲"
                        :disabled="isMobile && activeCoverIndex !== index"
                    >
                      <svg t="1759909281143" class="icon" style="width: 1em; height: 1em; vertical-align: middle; fill: currentcolor; overflow: hidden; font-size: 27px;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2678" width="27" height="27" data-spm-anchor-id="a313x.search_index.0.i6.1f9d3a81mzI6SG"><path d="M875.008 295.424a34.133333 34.133333 0 1 0-58.197333 35.669333c35.328 57.514667 53.930667 123.562667 53.930666 191.488 0 201.898667-164.352 366.250667-366.250666 366.250667S138.24 724.48 138.24 522.581333 302.592 156.330667 504.490667 156.330667c18.773333 0 34.133333-15.36 34.133333-34.133334s-15.36-34.133333-34.133333-34.133333C264.874667 88.064 69.973333 282.965333 69.973333 522.581333s194.901333 434.517333 434.517334 434.517334 434.517333-194.901333 434.517333-434.517334c0.170667-80.384-22.016-159.061333-64-227.157333z" fill="#231815" p-id="2679" data-spm-anchor-id="a313x.search_index.0.i7.1f9d3a81mzI6SG" class="selected"></path><path d="M501.248 389.973333c-77.653333 0-140.8 63.146667-140.8 140.8s63.146667 140.8 140.8 140.8 140.8-63.146667 140.8-140.8V224.256c0-19.456 15.872-35.328 35.328-35.328 19.456 0 35.328 15.872 35.328 35.328 0 18.773333 15.36 34.133333 34.133333 34.133333s34.133333-15.36 34.133334-34.133333c0-57.173333-46.421333-103.594667-103.594667-103.594667s-103.594667 46.421333-103.594667 103.594667v186.026667a140.526933 140.526933 0 0 0-72.533333-20.309334z m0 213.333334a72.704 72.704 0 0 1-72.533333-72.533334 72.704 72.704 0 0 1 72.533333-72.533333 72.704 72.704 0 0 1 72.533333 72.533333 72.704 72.704 0 0 1-72.533333 72.533334z" fill="#231815" p-id="2680" data-spm-anchor-id="a313x.search_index.0.i8.1f9d3a81mzI6SG"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 信息区域 -->
              <div class="audio-info">
                <h3 class="audio-title">{{ audio.title }}</h3>
                <p class="audio-author">
                  <span>歌手：</span>{{ audio.author }}
                </p>
                <!-- 主题色展示 -->
                <div class="color-indicator">
                  <span>主题色：</span>
                  <div
                      class="color-swatch"
                      :style="{ backgroundColor: audio.maincolor || '#3c3c43' }"
                  ></div>
                  <span class="color-code">{{ audio.maincolor || '#3c3c43' }}</span>
                </div>
                <!-- 播放按钮 -->
                <button
                    class="play-button"
                    @click="handlePlayClick(index)"
                    :disabled="index === playingIndex"
                    aria-label="播放"
                >
                  <svg width="24" height="24" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- 播放中状态 -->
                    <path
                        v-if="index === playingIndex"
                        d="M162.9 923.3c-27.9 0-50.7-22.8-50.7-50.7V559c0-27.9 22.8-50.7 50.7-50.7 27.9 0 50.7 22.8 50.7 50.7v313.6c0 27.9-22.8 50.7-50.7 50.7zM394.2 923.3c-27.9 0-50.7-22.8-50.7-50.7V144c0-27.9 22.8-50.7 50.7-50.7 27.9 0 50.7 22.8 50.7 50.7v728.6c0 27.9-22.9 50.7-50.7 50.7zM625.4 923.3c-27.9 0-50.7-22.8-50.7-50.7V436.3c0-27.9 22.8-50.7 50.7-50.7 27.9 0 50.7 22.8 50.7 50.7v436.4c0 27.8-22.8 50.6-50.7 50.6zM856.7 923.3c-27.9 0-50.7-22.8-50.7-50.7V260.5c0-27.9 22.8-50.7 50.7-50.7 27.9 0 50.7 22.8 50.7 50.7v612.2c0 27.8-22.8 50.6-50.7 50.6z"
                        fill="currentColor"
                    />
                    <!-- 未播放状态 -->
                    <path
                        v-else
                        d="M324.085 95.787l500.422 300.664c82.373 50.453 79.284 136.946-1.030 186.37v0l-506.6 304.784c-41.187 23.683-87.522 37.068-131.798 9.267-36.037-22.653-46.335-58.691-46.335-97.819v-616.774c0-39.127 13.386-75.166 48.395-97.819 45.305-27.801 94.731-14.416 136.946 11.327v0z"
                        fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

// 新增变量
const isMobile = ref(false);
const activeCoverIndex = ref(-1);

const handleCoverClick = (index) => {
  if (isMobile.value) {
    // 仅当未激活时才切换为激活，激活状态下点击不改变
    if (activeCoverIndex.value !== index) {
      activeCoverIndex.value = index;
    }
  }
};

// 新增窗口大小监听
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768; // 以768px为移动设备判断标准
};


// 父组件传递的当前播放索引
const props = defineProps({
  currentIndex: {
    type: Number,
    required: true
  }
});

// 播放索引
const playingIndex = ref(null);

// 控制模态框显示状态
const showModal = ref(true);

// 音频列表数据
const audioList = ref([]);

// 传出参数声明
const emit = defineEmits(['close','switch-index']);

// 关闭模态框
const closeModal = () => {
  activeCoverIndex.value = -1; // 新增
  showModal.value = false;
  emit('close');
};

// 播放按钮点击处理
const handlePlayClick = (index) => {
  emit('switch-index', index);
};

// 新增下载封面、歌曲方法
// 修改封面图下载方法（接收title、author参数，动态处理扩展名）
const downloadCover = (imageUrl, title, author) => {
  // 从URL中提取扩展名（处理可能带参数的URL，如xxx.png?size=100）
  const urlParts = imageUrl.split('?')[0]; // 移除URL参数部分
  const ext = urlParts.split('.').pop() || 'jpg'; // 提取扩展名，默认用jpg

  fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // 命名格式与歌曲保持一致：标题-歌手-cover.扩展名
        a.download = `${title}-${author}-cover.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(err => console.error('下载封面失败:', err));
};

// 新增下载歌曲方法
const downloadAudio = (audio) => {
  // 重点：这里的字段名必须与bg-music.json中实际的音频链接字段一致
  // 例如如果JSON里是"link": "xxx.mp3"，就用audio.link
  // 请根据你的JSON结构修改下面的字段名！！！
  const audioUrl = audio.flink; // 关键修复点：替换为实际字段名（如audio.src/audio.url/audio.downloadUrl等）

  // 调试用：打印获取到的地址，确认是否正确
  console.log('获取到的音频地址:', audioUrl);

  if (!audioUrl) {
    console.error('未找到音频下载地址，请检查字段名是否正确');
    return;
  }

  const a = document.createElement('a');
  a.href = audioUrl;
  const ext = audio.flink.split('.').pop(); // 从url中提取扩展名
  a.download = `${audio.title}-${audio.author}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 给模态框容器添加点击事件
// 在模板的modal-container上添加：@click="handleContainerClick"
const handleContainerClick = () => {
  if (isMobile.value) {
    activeCoverIndex.value = -1;
  }
};

// 加载音频数据
onMounted(async () => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  playingIndex.value = props.currentIndex;
  try {
    // VitePress 中加载静态资源需使用 import.meta.url
    const response = await fetch(new URL('/public/assets/data/bg-music.json', import.meta.url));
    if (!response.ok) {
      throw new Error('加载音频数据失败');
    }
    const data = await response.json();
    audioList.value = data;
  } catch (error) {
    console.error('音频数据加载错误:', error);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIsMobile);
});

watch(
    () => props.currentIndex,  // 监听父组件传递的currentIndex
    (newIndex) => {
      playingIndex.value = newIndex;  // 更新子组件播放索引
    },
    { immediate: true }  // 立即执行一次（可选，确保初始值正确）
);

</script>

<style scoped>
/* 遮罩层样式 */
/* 遮罩层样式强化 - 确保全屏覆盖 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0; /* 新增：强制覆盖左右 */
  bottom: 0; /* 新增：强制覆盖上下 */
  width: 100vw; /* 用视口单位确保全屏 */
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  z-index: 9999; /* 提高层级，确保覆盖播放器 */
  overflow: hidden; /* 防止父容器滚动影响 */
}

/* 模态框容器 - 强化视口定位 */
.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 650px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  box-shadow: 0 8px 30px rgba(255, 235, 205, 0.3), 0 0 0 1px rgba(255, 235, 205, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 235, 205, 0.3);
  z-index: 10000; /* 高于遮罩层 */
  /* 新增：脱离父容器堆叠上下文影响 */
  contain: layout paint;
  will-change: transform;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 20px;
  right: 24px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 235, 205, 0.3);
  cursor: pointer;
  color: #666;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(255, 235, 205, 0.7);
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: #333;
  box-shadow: none;
}

.close-btn:active {
  background-color: rgba(0, 0, 0, 0.08);
}

/* 标题样式 */
.modal-title {
  padding: 24px 24px 16px;
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 235, 205, 0.2);
}

/* 列表容器 */
.audio-list {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding: 20px;
  flex: 1;
}

/* 列表项样式 - 所有卡片都有默认阴影，移除悬停效果 */
.audio-item {
  display: flex;
  align-items: center;
  padding: 2px;
  border: 0 solid transparent;
  margin-bottom: 12px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* 增加高度计算参考 */
  min-height: 80px;
  position: relative;
  padding-right: 60px; /* 为按钮预留空间 */
  transition: all 0.3s ease-in-out;
}

/* 交替背景色 - #FFEBCD 与 #fff 相间 */
.audio-item.alternate-bg {
  background-color: #FFEBCD;
}

/* 封面图容器 */
.audio-cover {
  flex-shrink: 0;
  margin-right: 20px;
  /* 让封面图容器高度与父元素一致 */
  height: 100%;
  display: flex;
  align-items: center;
}

.cover-wrapper {
  position: relative;
  transition: all 0.3s ease;
}

/* 悬停变白效果 */
.cover-wrapper:hover .cover-img {
  filter: blur(1px);
}

.cover-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 15px;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

/* 悬停显示下载按钮 */
.cover-wrapper:hover .cover-actions {
  opacity: 1;
}

/* 下载按钮样式 */
.download-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: all 0.2s ease;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
}

.download-btn:hover {
  background-color: white;
  transform: scale(1.1);
}

.download-btn svg {
  width: 20px;
  height: 20px;
}

/* 封面图样式 等比拉伸 */
.cover-img {
  height: 120px;
  width: auto;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 235, 205, 0.3);
  transition: all 0.3s ease;
}

/* 信息区域样式 */
.audio-info {
  flex: 1;
  min-width: 0;
}

.audio-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-author {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 16px;
}

.audio-author span {
  color: #999;
}

/* 主题色指示器 */
.color-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #eee;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-code {
  color: #888;
  font-family: monospace;
}

.play-button {
  /* 绝对定位实现右侧垂直居中 */
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);

  /* 基础样式 */
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

/* 播放中状态样式 */
.play-button:disabled {
  color: #ffaf2a;
  cursor: default;
  background-color: rgba(255, 205, 123, 0.1);
}

.play-button:disabled:hover {
  background-color: rgba(255, 205, 123, 0.3);
}

/* 未播放状态悬停效果 */
.play-button:not(:disabled):hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.05);
}

.play-button:not(:disabled):active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 滚动条样式优化 - 替换紫色为 #FFEBCD 相关色调 */
.audio-list::-webkit-scrollbar {
  width: 8px;
}

.audio-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.audio-list::-webkit-scrollbar-thumb {
  background: rgb(255, 222, 173);
  border-radius: 4px;
}

.audio-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 222, 173, 0.85);
}

.audio-list::-webkit-scrollbar-thumb:active {
  background: rgb(255, 205, 123);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .modal-container {
    width: 95%;
    height: 95%;
    max-height: none;
  }

  .modal-title {
    font-size: 24px;
    padding: 20px 20px 16px;
  }

  .audio-list {
    padding: 16px;
    max-height: calc(90vh - 10px);
  }

  .audio-item {
    padding: 12px;
    min-height: 64px;
  }

  .audio-title {
    font-size: 16px;
  }

  .color-code {
    display: none;
  }
}

@media (max-width: 450px) {
  .play-button {
    right: 30px;
  }
}

@media (max-width: 400px) {
  .play-button {
    right: 10px;
  }
}

@media (max-width: 430px) {
  .audio-author {
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 370px) {
  .cover-img {
    height: 90px;
  }
  .cover-img[style*="height: 110px"] {
    height: 85px !important;
  }
  .cover-wrapper:hover .cover-img {
    filter: blur(1px);
  }
  .cover-wrapper:hover .cover-actions {
    opacity: 1;
  }
  .download-btn {
    margin: 0 -4px;
    background-color: rgba(255, 255, 255, 0.9);
  }
  .download-btn:hover {
    transform: none;
    background-color: rgba(255, 255, 255, 1);
  }
  .download-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;  /* 确保无法点击 */
  }
}
</style>