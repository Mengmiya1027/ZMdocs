<template>
  <div class="post-meta">
    <!-- 第一行：作者、时间、字数、阅读时长 -->
    <div class="meta-row">
      <!-- 作者列表（支持单个或多个） -->
      <template v-if="authorList.length">
        <span class="meta-item">
          <template v-for="(author, index) in authorList" :key="author.key">
            <img :src="author.avatar" class="author-avatar" alt="avatar" />
            <a v-if="author.url" :href="author.url" target="_blank" rel="noopener" class="meta-link">
              {{ author.name }}
            </a>
            <span v-else>{{ author.name }}</span>
          </template>
        </span>
      </template>

      <a
          v-if="createdAt"
          :href="createdCommitUrl"
          class="meta-item meta-link"
          target="_blank"
          rel="noopener"
      >
        📅 {{ formatDate(createdAt) }}
      </a>

      <a
          v-if="lastUpdated"
          :href="lastCommitUrl"
          class="meta-item meta-link"
          target="_blank"
          rel="noopener"
      >
        🔄 {{ formatDate(lastUpdated) }}
      </a>

      <span v-if="wordCount" class="meta-item">📝 {{ wordCount }} 字</span>
      <span v-if="readingTime" class="meta-item">⏱️ 约 {{ readingTime }} 分钟</span>
    </div>

    <!-- 第二行：标签 -->
    <div v-if="tags.length" class="tags-row">
      <span v-for="tag in tags" :key="tag" class="tag-item">#{{ tag }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page, theme } = useData()

// ---------- 作者列表（支持字符串或数组） ----------
const authorList = computed(() => {
  const author = frontmatter.value.author
  let keys = []
  if (Array.isArray(author)) {
    keys = author.map(a => String(a).trim()).filter(Boolean)
  } else if (typeof author === 'string' && author.trim()) {
    keys = [author.trim()]
  }
  if (!keys.length) return []

  const authors = theme.value.authors || {}
  const defaultAuthor = authors.default || {
    name: '',
    avatar: '/images/basic/default.png',
    url: ''
  }

  return keys.map(key => {
    const config = authors[key] || defaultAuthor
    return {
      key,
      name: config.name || key || '未知',
      avatar: config.avatar || '/images/basic/default.png',
      url: config.url || ''
    }
  })
})

// ---------- 时间 ----------
const createdAt = computed(() => frontmatter.value.createdAt || null)
const lastUpdated = computed(() => {
  const ts = page.value.lastUpdated
  return ts ? new Date(ts).toISOString() : null
})

// ---------- 字数与阅读时长 ----------
const wordCount = computed(() => frontmatter.value.wordCount || 0)
const readingTime = computed(() => frontmatter.value.readingTime || 0)

// ---------- 标签 ----------
const tags = computed(() => {
  const raw = frontmatter.value.tags
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean)
  return []
})

// ---------- GitHub 链接 ----------
const repoBase = computed(() => {
  const pattern = theme.value.editLink?.pattern
  if (!pattern) return '#'
  const base = pattern.replace(/\/edit\/.*$/, '')
  return base.replace(/\/$/, '')
})

const filePath = computed(() => page.value.filePath || '')

const createdCommitUrl = computed(() => {
  if (!filePath.value || !repoBase.value) return '#'
  return `${repoBase.value}/commits/main/${filePath.value}`
})

const lastCommitUrl = computed(() => {
  if (!filePath.value || !repoBase.value) return '#'
  return `${repoBase.value}/commits/main/${filePath.value}`
})

// ---------- 工具函数 ----------
function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* 样式完全保留原风格，无需改动 */
.post-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: fit-content;
  margin: 0 auto 12px auto;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid #eaeaea;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  padding: 5px;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}
.meta-row:hover {
  transform: scale(1.03);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  padding: 0 3px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, color 0.3s ease !important;
  font-weight: 500;
}
.meta-item:hover {
  transform: scale(1.04);
  z-index: 1;
}

.tag-item:hover {
  transform: scale(1.06);
  z-index: 1;
}

.meta-item:active,
.tag-item:active {
  transform: scale(0.99);
}
.author-avatar {
  width: 1.2em;
  height: 1.2em;
  border-radius: 50%;
  object-fit: cover;
  margin: 0;
}
.meta-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}
.meta-link:hover {
  color: #3a8ee6;
}
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.85rem;
}
.tag-item {
  background: var(--zm-background-medium);
  backdrop-filter: var(--zm-backdrop-blur-medium);
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  color: var(--vp-c-text-2);
  padding: 2px 8px;
  white-space: nowrap;
  transition: transform 0.2s ease;
}
</style>