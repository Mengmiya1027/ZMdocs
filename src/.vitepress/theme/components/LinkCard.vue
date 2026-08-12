<script setup lang="ts">
import { useRouter } from 'vitepress'

const props = defineProps<{
  title: string,
  link: string,
  target?: string
}>()

const defaultProps = {
  target: '_self'
}

const router = useRouter()

// 检查是否为外部链接
const isExternalLink = (path: string): boolean => {
  return /^(?:[a-z]+:)?\/\//i.test(path) ||
      path.startsWith('mailto:') ||
      path.startsWith('tel:') ||
      path.startsWith('//')
}

// 处理链接点击
const handleLinkClick = (e: MouseEvent) => {
  // 如果是外部链接或特殊目标，不处理
  if (isExternalLink(props.link) ||
      (props.target && props.target !== '_self') ||
      e.ctrlKey || e.metaKey || e.shiftKey) {
    return
  }

  // 阻止默认行为并使用 VitePress 路由
  e.preventDefault()
  router.go(props.link)
}
</script>

<template>
  <ClientOnly>
    <div class="linkcard">
      <a
          :href="props.link"
          :target="props.target || defaultProps.target"
          @click="handleLinkClick"
      >
        <div class="linkcardBody">
          <div class="traffic-light">
            <div class="point red" />
            <div class="point yellow" />
            <div class="point green" />
          </div>

          <div class="card-content" >
            <div class="card-title">{{ props.title }}</div>
            <div class="card-text">
              <slot></slot>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-tip">-点击进入-</span>
          </div>
        </div>
      </a>
    </div>
  </ClientOnly>
</template>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
/* 原有样式保持不变 */
.linkcard {
  margin-bottom: 2em;
}

.linkcardBody {
  border-radius: 8px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: var(--zm-background-medium);
  box-shadow: 2px 2px 8px 1px rgba(0, 0, 0, .15);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  transition: all .2s ease;
}

@media (min-width: 960px) {
  .linkcardBody:hover {
    border: 4px solid var(--vp-c-brand);
    box-shadow: 2px 2px 1px 0 rgba(0, 0, 0, .1);
    background: var(--zm-background-high);
    transform: scale(1.03);
  }
}

.linkcardBody:active {
  transform: scale(0.96);
  filter: none;
}

a {
  color: var(--vp-c-text-1);
  text-decoration-line: none;
  display: block; /* 确保链接填充整个卡片 */
  position: relative;
}

a::after {
  content: none !important;
}

.traffic-light{
  display: flex;
  margin: 10px 0 0 10px;
  gap: .3em;
}

.point {
  width: .5em;
  height: .5em;
  border-radius: 50%;
}

/* 分别定位并赋予颜色 */
.point.red {
  background: #ff5f57;         /* Mac 风格红色 */
}
.point.yellow {
  background: #ffbd2e;         /* 黄色（可改为 green） */
}
.point.green {
  background: #28c840;         /* 绿色（可改为 blue） */
}

.card-content{
  display: flex;
  align-items: baseline;
  width: 100%;
  padding: 24px 0 1vw 24px;
}

.card-title {
  font-size: 35px;
  font-weight: bolder;
  margin: auto 0;
  line-height: 32px;
}

.card-text {
  font-size: 16px;
  margin: auto auto 0;
  font-weight: bold;
}

.card-footer {
  width: 100%;
  text-align: center;
  height: 20px;
  margin: 6px 0;
  font-size: 12px;
}

.card-tip {
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .card-content{
    flex-direction: column;
    padding-right: 24px;
  }
  .card-title{
    margin: 0 auto 10px;
  }
}
</style>