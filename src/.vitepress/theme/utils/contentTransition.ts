// 文档切换动画（用户所称“联想设置效果”）：左侧栏点导航切文档时，正文【整列】与右侧大纲
// （.VPDocAsideOutline）一起从右滑入，形成整体“换页”感（耦合切换，而非逐张卡片）。
// 注意：滑入【只用 transform】，不用 opacity 淡入——因为对 .content / .VPDocAsideOutline
// 这类【后代带 backdrop-filter 卡片】的祖先做 opacity<1 动画，会让后代 backdrop-filter 采样到
// 空层、模糊瞬间失效（卡片变白），动画结束 opacity 回 1 才恢复。transform 不会破坏后代模糊
// （已在真实 Edge 像素级验证：祖先 transform 时卡片模糊 std≈14，与正常态 12 一致；祖先
// opacity<1 时 std≈101，模糊失效）。
//
// 触发规则（关键，见主 index.ts）：
// - 只在「文档路径真正变化」时播放（左侧栏切文档）。
// - 右侧栏大纲点 #锚点 只改同页 hash，不算切文档，因此【不】播放（避免误触发）。
//
// 实现要点：
// 1. 不用 useRoute()（enhanceApp 顶层会因 inject 未就绪报错 “called without provider”）。
// 2. 用 VitePress 钩子 router.onAfterRouteChange（本 alpha 版无 d；由 router.go /
//    popstate 必定触发）。但 onAfterRouteChange 早于 Vue 的 DOM flush，若立刻播动画会作用在
//    旧内容 / 新节点尚未挂载的窗口期，导致正文“看不到滑入”。因此 playDocSwitchAnimation
//    用 nextTick + requestAnimationFrame 延后到新内容渲染完成后再播。
// 3. 动画只作用于 .VPDoc .content（内容列）与 .VPDocAsideOutline（大纲容器），绝不碰
//    .VPDoc / .aside 自身，避免破坏右侧栏的 fixed 定位（见第19步修复）。正文用内容列
//    .content 而非 .vp-doc，是因为像 features.md 这类“只有 frontmatter、无正文 body”的
//    页面，.vp-doc 是空元素，动画作用在空元素上看不见，改用有结构的内容列可始终看到换页。
// 4. 用 Web Animations API（element.animate）直接播放，不依赖 CSS class / fill-mode，规避
//    CSS @keyframes 在该环境下“不显示”的玄学；动画结束自动归位（fill 默认 none）。
import type { Router } from 'vitepress'
import { nextTick } from 'vue'

// 正文【整列耦合】滑入 + 玻璃卡片“动态模糊”：
// 作用对象是正文内容列 .VPDoc .container > .content（整块滑入，配合右侧大纲一起，形成“联想设置”换页感），
// 同时正文内的每张玻璃卡片（.content-container:has(> .main) 下的 p / h1~h6）各自做 backdrop-filter 的
// blur 从 0 → 静止值(blur(12px)) 的“动态模糊”渐入，卡片随整列滑入的同时“结霜显形”。
//
// 滑入【只用 transform】，不用 opacity——理由见文件头：对祖先做 opacity<1 会让后代 backdrop-filter
// 采样空层、模糊失效变白。transform 不破坏后代模糊（已验证）。
//
// 为什么用“动态模糊”而非之前的 background-color 淡显：background-color 淡显要么整列蒙白（用户反馈
// “一股淡淡白颜色”），要么卡片 0→0.4 仍偏“白底长出”。改用直接动画卡片自身的 backdrop-filter blur 半径：
// 模糊是背景的“磨砂程度”，不引入任何白底、不碰 opacity，绝不会洗白整页；且模糊本身就是玻璃质感的核心，
// 动起来比白底更“玻璃”。仅动卡片自身 backdrop-filter，模糊全程保留。
//
// 用 fill:'backwards'：delay 到达前卡片停在 0% 关键帧（blur 0，即锐利），即“先停在右侧等待、
// 到点再滑入并结霜”，避免开始瞬间跳变。
let currentContentAnim: Animation | null = null
let currentCardAnims: Animation[] = []
let currentAsideAnim: Animation | null = null

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 整列滑入参数（可按手感微调）
const COLUMN_SHIFT = 28     // 起始右移距离(px)
const COLUMN_DURATION = 420 // 整列滑入时长(ms)
// 卡片动态模糊参数
const CARD_BLUR_DURATION = 420 // 与整列滑入同长，一起结束
const CARD_BLUR_DELAY = 0      // 0：与整列同步“耦合”模糊，不逐张错位，保持整体感

// 正文（内容列 .VPDoc .container > .content，总是存在且有结构；即使目标页正文为空也能看到整列滑入）。
// 注意：.VPDoc 下存在【两个】.content —— 其一是右栏大纲内部的窄 .content（.VPDocAsideOutline .content），
// document.querySelector('.VPDoc .content') 按 DOM 顺序会先命中它，导致正文动画错播到右栏。
// 因此必须用更精确的选择器命中正文列：.VPDoc .container > .content（正文列的父是 .container，
// 右栏用的是 .aside-container，结构不同）。找不到时回退到文章本体 .vp-doc（极少数非标准页）。
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

    // 2) 每张玻璃卡片“动态模糊”：backdrop-filter 的 blur 从 0 → 静止值(blur(12px)) 渐入，
    //    卡片随整列滑入的同时“结霜显形”。仅动 backdrop-filter（背景模糊半径），不碰 opacity、
    //    不动 background-color，因此【不会】产生整列淡显时的白雾，模糊也始终保留。
    //    saturate(1.8) 与 CSS 静止值保持一致，避免动画结束瞬间色彩增强跳变；结束关键帧直接取
    //    计算后的静止值，确保与 CSS 严格对齐、无跳变。
    const cards = content.querySelectorAll<HTMLElement>(
        '.content-container:has(> .main) :is(p, h1, h2, h3, h4, h5, h6)'
    )
    cards.forEach((card) => {
        const cs = getComputedStyle(card)
        const restBlur =
            cs.backdropFilter ||
            (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ||
            'blur(12px) saturate(1.8)'
        const anim = card.animate(
            [
                { backdropFilter: 'blur(0px) saturate(1.8)', webkitBackdropFilter: 'blur(0px) saturate(1.8)' },
                { backdropFilter: restBlur, webkitBackdropFilter: restBlur }
            ],
            {
                duration: CARD_BLUR_DURATION,
                delay: CARD_BLUR_DELAY,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards'
            }
        )
        currentCardAnims.push(anim)
    })
}

// 右侧大纲 .VPDocAsideOutline：轻微右滑入（与正文同向、幅度更轻，形成整体“联想设置”换页感）。
// 同样只用 transform，不用 opacity（理由同正文：祖先 opacity 会破坏后代卡片模糊）。
// 注意：.VPDocAsideOutline 是 sticky 的 .aside 的【后代】，动画后代不会破坏祖先 sticky。
export function playAsideTransition(): void {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return

    const el = document.querySelector<HTMLElement>('.VPDocAsideOutline')
    if (!el) return

    if (currentAsideAnim && currentAsideAnim.playState !== 'finished') {
        currentAsideAnim.cancel()
    }

    currentAsideAnim = el.animate(
        [
            { transform: 'translateX(14px)' },
            { transform: 'translateX(0)' }
        ],
        { duration: COLUMN_DURATION, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )
}

// 在「路由切换后、DOM 已用新内容渲染完成」的时机，一起播放正文 + 右侧大纲动画。
// 延后到 nextTick + rAF，确保动画播在【新内容】上，正文滑入才看得见。
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
