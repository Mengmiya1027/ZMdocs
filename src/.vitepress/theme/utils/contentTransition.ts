// 文档切换动画（联想设置效果）

import type { Router } from 'vitepress'
import { nextTick } from 'vue'

let currentContentAnim: Animation | null = null
let currentCardAnims: Animation[] = []
let currentAsideAnim: Animation | null = null
let currentAsideTextAnims: Animation[] = []

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 整列滑入参数（可按手感微调）
const COLUMN_SHIFT = 28     // 起始右移距离(px)
const COLUMN_DURATION = 420 // 整列滑入时长(ms)
// 卡片玻璃层“结霜”参数（动画 ::before 的 backdrop-filter）
const CARD_BLUR_DURATION = 420 // 与整列滑入同长，一起结束
const CARD_BLUR_DELAY = 0      // 0：与整列同步耦合模糊，不逐张错位
// 卡片文字层“淡入”参数（动画卡片本体的 color + 向左推入）
const CARD_TEXT_DURATION = 300 // 缩短，让淡入更快
const CARD_TEXT_DELAY = 20     // 微调滞后，结霜先起、文字随后浮现并向左推入，层次更柔
const CARD_TEXT_SHIFT = 18     // 文字层起始右移距离(px)，向 0 推入 = 向左推入
// 右侧大纲文字层“淡入”参数（与正文同方案：color 淡入 + 向左推入，避免变白）
const ASIDE_TEXT_DURATION = 300
const ASIDE_TEXT_DELAY = 20
const ASIDE_TEXT_SHIFT = 12     // 右侧栏幅度比正文小，避免抢戏

// 正文（内容列 .VPDoc .container > .content，总是存在且有结构；即使目标页正文为空也能看到整列滑入）。
export function playContentTransition(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return

    const content =
        document.querySelector<HTMLElement>('.VPDoc .container > .content') ??
        document.querySelector<HTMLElement>('.VPDoc .content') ??
        document.querySelector<HTMLElement>('.vp-doc')
    if (!content) return

    // 打断上一段未播完的整列 / 卡片动画，避免快速连点导航时动画叠加
    if (currentContentAnim && currentContentAnim.playState !== 'finished') {
        currentContentAnim.cancel()
    }
    currentCardAnims.forEach((a) => { if (a.playState !== 'finished') a.cancel() })
    currentCardAnims = []

    // 1) 整列耦合滑入（只用 transform，不碰 opacity，避免破坏后代玻璃卡片模糊）
    currentContentAnim = content.animate(
        [
            { transform: `translateX(${COLUMN_SHIFT}px)` },
            { transform: 'translateX(0)' }
        ],
        {
            duration: COLUMN_DURATION,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards'
        }
    )

    // 2) 每张玻璃卡片：双层并行动画（既要淡入、又不变白）
    const cards = content.querySelectorAll<HTMLElement>(
        '.content-container:has(> .main) :is(p, h1, h2, h3, h4, h5, h6)'
    )
    cards.forEach((card) => {
        const restColor = getComputedStyle(card).color
        // ① 玻璃层结霜（作用于 ::before 伪元素）
        const beforeCs = getComputedStyle(card, '::before')
        const restBlur =
            beforeCs.backdropFilter ||
            (beforeCs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ||
            'blur(12px) saturate(180%)'
        const frostAnim = card.animate(
            [
                { backdropFilter: 'blur(0px) saturate(180%)', webkitBackdropFilter: 'blur(0px) saturate(180%)' },
                { backdropFilter: restBlur, webkitBackdropFilter: restBlur }
            ],
            {
                pseudoElement: '::before',
                duration: CARD_BLUR_DURATION,
                delay: CARD_BLUR_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards'
            }
        )
        currentCardAnims.push(frostAnim)
        // ② 文字层淡入（颜色透明→显示 + 向左推入）
        const textAnim = card.animate(
            [
                { color: 'transparent', transform: `translateX(${CARD_TEXT_SHIFT}px)` },
                { color: restColor, transform: 'translateX(0)' }
            ],
            {
                duration: CARD_TEXT_DURATION,
                delay: CARD_TEXT_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards'
            }
        )
        currentCardAnims.push(textAnim)
    })
}

// 右侧大纲 .VPDocAsideOutline：轻微右滑入（与正文同向、幅度更轻，形成整体“联想设置”换页感）。

export function playAsideTransition(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return

    const el = document.querySelector<HTMLElement>('.VPDocAsideOutline')
    if (!el) return

    if (currentAsideAnim && currentAsideAnim.playState !== 'finished') {
        currentAsideAnim.cancel()
    }
    currentAsideTextAnims.forEach((a) => { if (a.playState !== 'finished') a.cancel() })
    currentAsideTextAnims = []

    // 容器整体轻微右滑入（只用 transform）
    currentAsideAnim = el.animate(
        [
            { transform: 'translateX(14px)' },
            { transform: 'translateX(0)' }
        ],
        { duration: COLUMN_DURATION, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )

    // 大纲文字层淡入 + 向左推入（与正文同方案，color 淡入而非 opacity，绝对不变白）
    const asideTexts = el.querySelectorAll<HTMLElement>('.outline-title, a')
    asideTexts.forEach((t) => {
        const restColor = getComputedStyle(t).color
        const a = t.animate(
            [
                { color: 'transparent', transform: `translateX(${ASIDE_TEXT_SHIFT}px)` },
                { color: restColor, transform: 'translateX(0)' }
            ],
            { duration: ASIDE_TEXT_DURATION, delay: ASIDE_TEXT_DELAY, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
        )
        currentAsideTextAnims.push(a)
    })
}

// 一起播放正文 + 右侧大纲动画。
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

// 注册：仅做首屏的一次正文播放（用于入场后第一页的淡入）；路由切换由主 index.ts 统一驱动。
export function setupContentTransition(_router?: Router): void {
    if (typeof window === 'undefined') return
    nextTick(() => {
        requestAnimationFrame(playContentTransition)
    })
}
