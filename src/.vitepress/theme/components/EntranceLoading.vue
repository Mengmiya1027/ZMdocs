<template>
  <div id="loader-wrapper" :class="{ loaded }">
    <div class="loader">
      <div class="loader-ring">
        <div class="loader-circle" />
        <img class="loader-logo" src="/images/basic/zm2.png" alt="" />
      </div>
      <div class="loader-text">
        <span class="name">
          {{ siteName }}
        </span>
        <span class="tip"> 加载中 </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()

// 站点名：优先取 VitePress 站点标题，兜底 ZMdocs
const siteName = site.value?.title || 'ZMdocs'

// 加载完成状态（替代 home-dev 的 Pinia store.imgLoadStatus）
const loaded = ref(false)
let finished = false

const dismiss = () => {
  if (finished) return
  finished = true
  loaded.value = true
}

onMounted(() => {
  // 入场动画在组件挂载时立即播放一次；
  // 退场在首屏资源加载完成后触发，并保留一个最短展示时长，
  // 让旋转 / 入场动画被看到；用兜底计时防止 load 迟迟不触发导致卡死。
  const minShow = 900 // ms，最短展示时长
  const hardCap = 2600 // ms，最长兜底

  const onReady = () => setTimeout(dismiss, minShow)

  if (document.readyState === 'complete') {
    onReady()
  } else {
    window.addEventListener('load', onReady, { once: true })
  }
  // 兜底：即使 load 一直不触发，也最迟在 hardCap 收起
  setTimeout(dismiss, hardCap)
})
</script>

<style lang="scss" scoped>
#loader-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  overflow: hidden;
  background: var(--vp-c-bg, #1b1b1f);

  // 入场光晕：中心白光从内向外扩散再淡出
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 62%);
    opacity: 0;
    pointer-events: none;
    animation: flash-in 0.85s ease both;
  }

  // 加载完成：退场——
  &.loaded {
    pointer-events: none;
    // 整屏背景稍后淡出，让 logo 的冲刺先被看到
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.45s ease 0.22s,
      visibility 0.45s ease 0.22s;

    .loader-ring {
      animation: ring-burst 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .loader-logo {
      animation: logo-zoom 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .loader-text {
      animation: text-pop 0.42s ease forwards;
    }
  }

  .loader {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    // 圆环 + 中心 logo 的容器，保证两者居中对齐
    .loader-ring {
      position: relative;
      width: 150px;
      height: 150px;
      // 入场：整组从中心弹入（带回弹）
      animation: ring-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;

      .loader-circle {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: var(--vp-c-text-1, #fff);
        animation: spin 1.8s linear infinite;

        &:before {
          content: "";
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: var(--vp-c-text-2, #a4a4a4);
          animation: spin-reverse 0.6s linear infinite;
        }

        &:after {
          content: "";
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: var(--vp-c-text-3, #d3d3d3);
          animation: spin 1s linear infinite;
        }
      }

      // 中心 logo：从 home-dev 的纯文字标题改为 zm2.png 图片
      .loader-logo {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 82px;
        height: 82px;
        border-radius: 50%;
        object-fit: cover;
        z-index: 3;
        // 入场：logo 从小放大 + 高光闪入
        animation: logo-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
    }

    .loader-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--vp-c-text-1, #fff);
      z-index: 2;
      margin-top: 40px;
      font-size: 24px;
      // 入场：文字上移淡入（稍延迟，等环和 logo 落定）
      animation: text-in 0.6s ease 0.15s both;
      .tip {
        margin-top: 6px;
        font-size: 18px;
        opacity: 0.6;
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

// 入场：圆环整组从中心弹入
@keyframes ring-in {
  0% {
    transform: scale(0.55) rotate(-30deg);
    opacity: 0;
    filter: blur(6px);
  }
  60% {
    transform: scale(1.06) rotate(8deg);
    opacity: 1;
    filter: blur(0);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: blur(0);
  }
}

// 入场：logo 从小放大 + 高光闪入
@keyframes logo-in {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
    filter: brightness(2.2) blur(8px);
  }
  60% {
    transform: translate(-50%, -50%) scale(1.12);
    opacity: 1;
    filter: brightness(1.5) blur(0);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    filter: brightness(1) blur(0);
  }
}

// 入场：文字上移淡入
@keyframes text-in {
  0% {
    transform: translateY(18px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

// 入场：中心光晕从内扩散后淡出
@keyframes flash-in {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

// 退场：logo 向前冲刺放大 + 高光闪烁 + 模糊消散
@keyframes logo-zoom {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    filter: brightness(1) blur(0);
  }
  35% {
    opacity: 1;
    filter: brightness(1.9) blur(0);
  }
  100% {
    transform: translate(-50%, -50%) scale(2.6);
    opacity: 0;
    filter: brightness(1) blur(8px);
  }
}

// 退场：圆环向外炸开 + 旋转 + 模糊
@keyframes ring-burst {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: blur(0);
  }
  100% {
    transform: scale(1.3) rotate(40deg);
    opacity: 0;
    filter: blur(5px);
  }
}

// 退场：文字上抛淡出
@keyframes text-pop {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-14px);
    opacity: 0;
  }
}
</style>
