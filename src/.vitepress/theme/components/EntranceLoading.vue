<template>
  <div id="loader-wrapper" :class="{ loaded }">
    <!-- 背景动态光晕层（纯 CSS 实现） -->
    <div class="bg-glow"></div>

    <div class="loader">
      <div class="loader-ring">
        <!-- 单环渐变流光（通过 mask 裁切出圆环） -->
        <div class="loader-circle" />
        <img class="loader-logo" src="/images/basic/zm2.png" alt="" />
      </div>
      <div class="loader-text">
        <span class="name">
          {{ siteName }}
        </span>
        <span class="tip">
          加载中
          <span class="dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </span>
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

// 加载完成状态
const loaded = ref(false)
let finished = false

const dismiss = () => {
  if (finished) return
  finished = true
  loaded.value = true
}

onMounted(() => {
  // 入场动画：等首屏资源加载完成再收起，
  // 并保留一个最短展示时长，让旋转动画被看到；
  // 用兜底计时防止 load 事件迟迟不触发导致幕布卡死。
  const minShow = 1500 // ms，最短展示时长
  const hardCap = 3000 // ms，最长兜底

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
  // 【美化1】暗色渐变 + 微动态底色
  background: radial-gradient(circle at 50% 40%, #23232b, #0e0e12 80%);
  display: flex;
  align-items: center;
  justify-content: center;

  // 背景光晕（在底层缓慢呼吸）
  .bg-glow {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 140%;
    height: 140%;
    background: radial-gradient(circle at 30% 30%, rgba(66, 184, 131, 0.08), transparent 50%);
    animation: bg-shift 8s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }

  // 加载完成：退场过渡
  &.loaded {
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition:
        opacity 0.45s ease 0.25s,
        visibility 0.45s ease 0.25s;

    // 退场时，背景光晕迅速收缩消失
    .bg-glow {
      animation: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .loader-ring {
      animation: ring-burst 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .loader-logo {
      // 覆盖掉呼吸动画，执行冲刺退场
      animation: logo-zoom 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
    }
    .loader-text {
      animation: text-pop 0.42s ease forwards;
    }
  }

  .loader {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .loader-ring {
      position: relative;
      width: 150px;
      height: 150px;

      // 【美化2】单环渐变流光（取代原来的三层边框）
      .loader-circle {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        // 核心：锥形渐变制造流光，配合 mask 切出圆环
        background: conic-gradient(
            from 0deg,
            transparent 0%,
            var(--vp-c-brand, #42b883) 25%,
            rgba(66, 184, 131, 0.1) 60%,
            transparent 80%,
            transparent 100%
        );
        // mask 裁切：中间挖空（48%~49% 是硬边），外部留边（到 79%）
        mask: radial-gradient(
            circle,
            transparent 45%,
            #000 47%,
            #000 78%,
            transparent 80%
        );
        -webkit-mask: radial-gradient(
            circle,
            transparent 45%,
            #000 47%,
            #000 78%,
            transparent 80%
        );
        animation: spin 1.8s linear infinite;
        // 加一点发光柔化，提升质感
        filter: drop-shadow(0 0 8px rgba(66, 184, 131, 0.3));
      }

      // 【美化3】中心 Logo：脉动呼吸 + 光晕
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
        // 基础状态：呼吸动画
        animation: logo-breathe 2.4s ease-in-out infinite;
        box-shadow: 0 0 30px rgba(66, 184, 131, 0.15);
        // 保证 logo 图片边缘清晰
        background-color: #141417;
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
      font-weight: 400;
      letter-spacing: 1px;

      .tip {
        margin-top: 10px;
        font-size: 16px;
        opacity: 0.5;
        font-weight: 300;
        display: flex;
        align-items: center;
        gap: 4px;

        // 【美化4】三点波浪弹跳
        .dots {
          display: inline-flex;
          gap: 4px;
          margin-left: 2px;

          span {
            display: inline-block;
            font-size: 20px;
            line-height: 1;
            animation: dot-bounce 1.4s ease-in-out infinite;
            &:nth-child(2) {
              animation-delay: 0.2s;
            }
            &:nth-child(3) {
              animation-delay: 0.4s;
            }
          }
        }
      }
    }
  }
}

// --- 基础动画 Keyframes ---

// 圆环旋转
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

 //背景光晕缓慢漂移
@keyframes bg-shift {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.1) translate(5%, 5%);
  }
}

// Logo 脉动呼吸
@keyframes logo-breathe {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 20px rgba(66, 184, 131, 0.1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 45px rgba(66, 184, 131, 0.25);
  }
}

// 三点波浪弹跳
@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
}

// --- 退场动画 Keyframes ---

// 退场：Logo 冲刺放大 + 高光 + 模糊消散
@keyframes logo-zoom {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    filter: brightness(1) blur(0);
    box-shadow: 0 0 20px rgba(66, 184, 131, 0.2);
  }
  35% {
    opacity: 1;
    filter: brightness(1.9) blur(0);
    box-shadow: 0 0 60px rgba(66, 184, 131, 0.6);
  }
  100% {
    transform: translate(-50%, -50%) scale(2.8);
    opacity: 0;
    filter: brightness(1) blur(10px);
    box-shadow: 0 0 0px rgba(66, 184, 131, 0);
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
    transform: scale(1.4) rotate(60deg);
    opacity: 0;
    filter: blur(6px);
  }
}

// 退场：文字上抛淡出
@keyframes text-pop {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-18px);
    opacity: 0;
  }
}
</style>