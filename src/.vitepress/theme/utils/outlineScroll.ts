// 右侧大纲（进度条）导航点击 → 平滑滚动 + 目标标题高亮
// 优化点：滚动更快、起步即响应（easeOut）、点击其他项或手动滚动可随时打断。支持任意 a[href^="#"] 链接，并增加标题文本匹配回退

let rafId = 0
let animating = false
let currentFlashEl: HTMLElement | null = null

// 用户主动滚动（滚轮 / 触摸 / 滚动键）时打断自动滚动
function cancelScroll() {
    if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
    }
    animating = false
}

export function setupOutlineSmoothScroll() {
    if (typeof document === 'undefined') return

    const onInterrupt = (e: Event) => {
            if (!animating) return
            if (e.type === 'keydown') {
                const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']
                // @ts-ignore
                if (!scrollKeys.includes((e as KeyboardEvent).key)) return
            }
            cancelScroll()
        }
    ;(['wheel', 'touchmove', 'keydown'] as const).forEach((ev) =>
        window.addEventListener(ev, onInterrupt, { passive: true })
    )

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null
        // 扩展：匹配所有以 # 开头的链接（不仅限于大纲和标题锚点）
        const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
        if (!link) return

        const href = link.getAttribute('href') || ''
        if (href === '#') return // 空锚点不处理

        const id = decodeURIComponent(href.slice(1)).trim()
        if (!id) return

        // 1. 优先通过 ID 查找
        let heading = document.getElementById(id)

        // 2. 若未找到，尝试通过标题文本匹配（回退方案）
        if (!heading) {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
            for (const h of headings) {
                // 去除多余空格，并忽略大小写（中文不区分，但可兼容英文）
                if (h.textContent?.trim() === id) {
                    heading = h as HTMLElement
                    break
                }
            }
        }

        if (!heading) return // 找不到目标，不干预默认行为

        e.preventDefault()
        cancelScroll()

        const navHeight = getNavHeight()
        const top = heading.getBoundingClientRect().top + window.scrollY - navHeight - 24

        flashHeading(heading)
        smoothScrollTo(Math.max(0, top), 350)
        history.pushState(null, '', href)
    }, { passive: false })
}

function getNavHeight(): number {
    const num = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height'))
    // @ts-ignore
    return Number.isFinite(num) && num > 0 ? num : 48
}

function smoothScrollTo(targetY: number, duration = 350) {
    const startY = window.scrollY
    const diff = targetY - startY
    if (Math.abs(diff) < 1) {
        animating = false
        return
    }
    animating = true
    const startTime = performance.now()
    // easeOutCubic：起步即最大速度，跟手、收尾平稳
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        window.scrollTo(0, startY + diff * easeOutCubic(t))
        if (t < 1) {
            rafId = requestAnimationFrame(step)
        } else {
            rafId = 0
            animating = false
        }
    }
    rafId = requestAnimationFrame(step)
}

function flashHeading(el: HTMLElement) {
    if (currentFlashEl && currentFlashEl !== el) {
        currentFlashEl.classList.remove('zm-heading-flash')
    }
    currentFlashEl = el
    el.classList.remove('zm-heading-flash')
    void el.offsetWidth // 强制重排以重启动画
    el.classList.add('zm-heading-flash')
    el.addEventListener('animationend', () => {
        el.classList.remove('zm-heading-flash')
        if (currentFlashEl === el) currentFlashEl = null
    }, { once: true })
}
