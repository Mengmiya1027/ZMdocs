<template>
  <div class="post-meta">
    <span v-if="author" class="meta-item">
      {{ author }}
    </span>
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
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page, theme } = useData()

const author = computed(() => frontmatter.value.author)
const createdAt = computed(() => frontmatter.value.createdAt)
const lastUpdated = computed(() => {
  if (page.value.lastUpdated) {
    return new Date(page.value.lastUpdated).toISOString()
  }
  return null
})
const wordCount = computed(() => frontmatter.value.wordCount)
const readingTime = computed(() => frontmatter.value.readingTime)

// 从 editLink.pattern 中提取仓库基础 URL
const repoBase = computed(() => {
  const pattern = theme.value.editLink?.pattern
  if (!pattern) return '#'
  // 例: 'https://github.com/user/repo/edit/main/:path'
  // 取 'edit' 之前的路径，并去掉末尾可能的 '/'
  const base = pattern.replace(/\/edit\/.*$/, '')
  return base.replace(/\/$/, '')
})

// 文件路径，用于拼接链接
const filePath = computed(() => page.value.filePath || '')

// 创建时间对应链接（指向文件历史首页）
const createdCommitUrl = computed(() => {
  if (!filePath.value || !repoBase.value) return '#'
  return `${repoBase.value}/commits/main/${filePath.value}`
})

// 更新时间对应链接（同样指向文件历史）
const lastCommitUrl = computed(() => {
  if (!filePath.value || !repoBase.value) return '#'
  return `${repoBase.value}/commits/main/${filePath.value}`
})

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
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 0.75rem;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.meta-link {
  color: inherit;
  text-decoration: none;
}
.meta-link:hover {
  color: #3a8ee6;
}
</style>