// 文档切换动画（联想设置效果）
// 模块职责：
//   - 提供整列滑入、卡片玻璃层结霜、文字淡入等动画效果
//   - 管理首屏入场动画
//   - 监听路由切换（onAfterRouteChange / watch），自动重播换页动画
//   - 拦截同页导航（侧栏/顶栏指向当前页的链接），改为平滑滚动 + 重播动画
//   - 路径规范化，避免因 .html / hash 导致误触发

import type { Router } from 'vitepress'
import { nextTick, watch } from 'vue'

let currentContentAnim: Animation | null = null
let currentCardAnims: Animation[] = []
let currentAsideAnim: Animation | null = null
let currentAsideTextAnims: Animation[] = []

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
}

// 整列滑入参数（可按手感微调）
const COLUMN_SHIFT = 28
const COLUMN_DURATION = 420

// 卡片玻璃层“结霜”参数
const CARD_BLUR_DURATION = 420
const CARD_BLUR_DELAY = 0

// 卡片文字层“淡入”参数
const CARD_TEXT_DURATION = 300
const CARD_TEXT_DELAY = 20
const CARD_TEXT_SHIFT = 18

// 右侧大纲文字层参数
const ASIDE_TEXT_DURATION = 300
const ASIDE_TEXT_DELAY = 20
const ASIDE_TEXT_SHIFT = 12

// ---------- 核心动画函数 ----------

export function playContentTransition(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return

    const content =
        document.querySelector<HTMLElement>('.VPDoc .container > .content') ??
        document.querySelector<HTMLElement>('.VPDoc .content') ??
        document.querySelector<HTMLElement>('.vp-doc')
    if (!content) return

    // 中断未完成的动画
    if (currentContentAnim && currentContentAnim.playState !== 'finished') {
        currentContentAnim.cancel()
    }
    currentCardAnims.forEach((a) => {
        if (a.playState !== 'finished') a.cancel()
    })
    currentCardAnims = []

    // 1) 整列滑入
    currentContentAnim = content.animate(
        [
            { transform: `translateX(${COLUMN_SHIFT}px)` },
            { transform: 'translateX(0)' },
        ],
        {
            duration: COLUMN_DURATION,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
        }
    )

    // 2) 每张玻璃卡片：双层动画
    const cards = content.querySelectorAll<HTMLElement>(
        '.content-container:has(> .main) :is(p, h1, h2, h3, h4, h5, h6)'
    )
    cards.forEach((card) => {
        const restColor = getComputedStyle(card).color
        const beforeCs = getComputedStyle(card, '::before')
        const restBlur =
            beforeCs.backdropFilter ||
            (beforeCs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ||
            'blur(12px) saturate(180%)'

        // 玻璃层结霜
        const frostAnim = card.animate(
            [
                {
                    backdropFilter: 'blur(0px) saturate(180%)',
                    webkitBackdropFilter: 'blur(0px) saturate(180%)',
                },
                { backdropFilter: restBlur, webkitBackdropFilter: restBlur },
            ],
            {
                pseudoElement: '::before',
                duration: CARD_BLUR_DURATION,
                delay: CARD_BLUR_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards',
            }
        )
        currentCardAnims.push(frostAnim)

        // 文字层淡入 + 左推
        const textAnim = card.animate(
            [
                { color: 'transparent', transform: `translateX(${CARD_TEXT_SHIFT}px)` },
                { color: restColor, transform: 'translateX(0)' },
            ],
            {
                duration: CARD_TEXT_DURATION,
                delay: CARD_TEXT_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards',
            }
        )
        currentCardAnims.push(textAnim)
    })
}

export function playAsideTransition(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return

    const el = document.querySelector<HTMLElement>('.VPDocAsideOutline')
    if (!el) return

    if (currentAsideAnim && currentAsideAnim.playState !== 'finished') {
        currentAsideAnim.cancel()
    }
    currentAsideTextAnims.forEach((a) => {
        if (a.playState !== 'finished') a.cancel()
    })
    currentAsideTextAnims = []

    // 容器整体轻微右滑
    currentAsideAnim = el.animate(
        [{ transform: 'translateX(14px)' }, { transform: 'translateX(0)' }],
        {
            duration: COLUMN_DURATION,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
    )

    // 大纲文字淡入 + 左推
    const asideTexts = el.querySelectorAll<HTMLElement>('.outline-title, a')
    asideTexts.forEach((t) => {
        const restColor = getComputedStyle(t).color
        const a = t.animate(
            [
                { color: 'transparent', transform: `translateX(${ASIDE_TEXT_SHIFT}px)` },
                { color: restColor, transform: 'translateX(0)' },
            ],
            {
                duration: ASIDE_TEXT_DURATION,
                delay: ASIDE_TEXT_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards',
            }
        )
        currentAsideTextAnims.push(a)
    })
}

export function playDocSwitchAnimation(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return
    nextTick(() => {
        requestAnimationFrame(() => {
            playContentTransition()
            playAsideTransition()
        })
    })
}

// ---------- 路由集成封装 ----------

export function setupContentTransition(router: Router): void {
    if (typeof window === 'undefined') return

    // 首屏入场
    nextTick(() => {
        requestAnimationFrame(playDocSwitchAnimation)
    })

    // 路径规范化（消除 .html / 末尾斜杠 / index.html 差异）
    const normalizePath = (p?: string): string => {
        if (!p) return ''
        let s = p
        s = s.replace(/\/index\.html$/, '/')
        s = s.replace(/\.html$/, '')
        if (s.length > 1) s = s.replace(/\/+$/, '')
        return s
    }

    let lastPath = normalizePath(router.route.path)
    let lastPlay = 0

    const afterRoute = (href?: string) => {
        let toPath: string
        if (typeof href === 'string') {
            try {
                toPath = normalizePath(new URL(href, location.href).pathname)
            } catch {
                toPath = normalizePath(router.route.path)
            }
        } else {
            toPath = normalizePath(router.route.path)
        }

        if (toPath !== lastPath) {
            const now = Date.now()
            if (now - lastPlay > 60) {
                lastPlay = now
                nextTick(() => requestAnimationFrame(playDocSwitchAnimation))
            }
        }
        lastPath = toPath
    }

    // 挂载 onAfterRouteChange（保留之前的钩子）
    const prevHook = (router as any).onAfterRouteChange
    ;(router as any).onAfterRouteChange = (to: string) => {
        if (typeof prevHook === 'function') {
            try {
                prevHook(to)
            } catch (e) {
                console.error('[contentTransition] prev onAfterRouteChange 失败:', e)
            }
        }
        afterRoute(to)
    }

    // watch 兜底
    watch(() => router.route.path, (to) => afterRoute(to))

    // 同页导航拦截：点击侧栏/顶栏链接，如果指向当前页面，则平滑滚动并重播动画
    const onSamePageNavClick = (e: MouseEvent) => {
        const link = (e.target as HTMLElement)?.closest<HTMLAnchorElement>(
            '.VPSidebar a, .VPNav a, .VPNavScreen a'
        )
        if (!link) return
        const href = link.getAttribute('href')
        if (!href || /^(https?:)?\/\//i.test(href) || href.startsWith('#')) return

        let linkPath: string
        try {
            linkPath = normalizePath(new URL(href, location.href).pathname)
        } catch {
            return
        }
        const curPath = normalizePath(router.route.path)
        if (linkPath !== curPath) return

        // 同页：阻止默认瞬跳，平滑滚动到锚点或顶部，并重播动画
        e.preventDefault()
        e.stopPropagation()

        if (link.hash) {
            const anchor = document.getElementById(decodeURIComponent(link.hash.slice(1)))
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        nextTick(() => requestAnimationFrame(playDocSwitchAnimation))
    }
    document.addEventListener('click', onSamePageNavClick, true)
}