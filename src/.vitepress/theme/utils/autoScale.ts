// .vitepress/theme/utils/autoScale.ts
import { onMounted, onUnmounted, nextTick, ref, type Ref } from 'vue'

export interface AutoScaleOptions {
    /** 设计宽度（最大宽度），默认 1280px */
    maxWidth?: number
    /** 需要缩放的目标元素选择器，默认 '.VPContent'，可自行调整 */
    targetSelector?: string
    /** 是否启用过渡动画，默认 true */
    smooth?: boolean
}

/**
 * 设置自动缩放，使目标元素宽度始终 ≤ maxWidth，并根据窗口宽度等比缩放
 * @param options 配置项
 * @returns scale 响应式数值，可用于调试或额外逻辑
 */
export function useAutoScale(options: AutoScaleOptions = {}): { scale: Ref<number> } {
    const {
        maxWidth = 1280,
        targetSelector = '.VPContent',
        smooth = true
    } = options

    const scale = ref(1)
    let targetEl: HTMLElement | null = null
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    let resizeObserver: ResizeObserver | null = null

    // 核心缩放函数
    const applyScale = () => {
        if (!targetEl) return

        const windowWidth = window.innerWidth
        const newScale = Math.min(1, windowWidth / maxWidth)
        scale.value = newScale

        targetEl.style.transform = `scale(${newScale})`
        targetEl.style.transformOrigin = 'top center'
        targetEl.style.width = `${maxWidth}px`
        targetEl.style.margin = '0 auto'

        // 调整父容器高度，避免内容被截断
        const parent = targetEl.parentElement
        if (parent) {
            const originalHeight = targetEl.scrollHeight
            parent.style.height = `${originalHeight * newScale}px`
            parent.style.overflow = 'hidden'
        }
    }

    // 防抖 resize
    const debouncedResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(applyScale, 100)
    }

    // 初始化
    const init = () => {
        targetEl = document.querySelector(targetSelector) as HTMLElement
        if (!targetEl) {
            console.warn('[AutoScale] 未找到元素:', targetSelector)
            return
        }

        // 开启平滑过渡
        if (smooth) {
            targetEl.style.transition = 'transform 0.15s ease-out'
        }

        applyScale()

        // 监听窗口变化
        window.addEventListener('resize', debouncedResize)

        // 监听内容变化（路由切换、DOM 更新）
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => applyScale())
            resizeObserver.observe(targetEl)
        }
    }

    // 清理
    const cleanup = () => {
        window.removeEventListener('resize', debouncedResize)
        if (resizeTimer) {
            clearTimeout(resizeTimer)
            resizeTimer = null
        }
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
        if (targetEl) {
            targetEl.style.transform = ''
            targetEl.style.transformOrigin = ''
            targetEl.style.width = ''
            targetEl.style.margin = ''
            targetEl.style.transition = ''
            const parent = targetEl.parentElement
            if (parent) {
                parent.style.height = ''
                parent.style.overflow = ''
            }
        }
    }

    onMounted(() => {
        nextTick(init)
    })

    onUnmounted(cleanup)

    return { scale }
}