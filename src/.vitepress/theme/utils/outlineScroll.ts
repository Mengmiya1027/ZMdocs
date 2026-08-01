// 右侧大纲（进度条）导航点击 → 平滑滚动 + 目标标题高亮
// 优化点：滚动更快、起步即响应（easeOut）、点击其他项或手动滚动可随时打断

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
            if (!scrollKeys.includes((e as KeyboardEvent).key)) return
        }
        cancelScroll()
    }
    ;(['wheel', 'touchmove', 'keydown'] as const).forEach((ev) =>
        window.addEventListener(ev, onInterrupt, { passive: true })
    )

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null
        const link = target?.closest?.('.outline-link') as HTMLAnchorElement | null
        if (!link) return

        const href = link.getAttribute('href') || ''
        if (!href.startsWith('#') || href.length < 2) return

        const id = decodeURIComponent(href.slice(1))
        const heading = document.getElementById(id)
        if (!heading) return

        e.preventDefault()
        cancelScroll() // 新点击先打断旧动画

        const navHeight = getNavHeight()
        const top = heading.getBoundingClientRect().top + window.scrollY - navHeight - 24

        flashHeading(heading)
        smoothScrollTo(Math.max(0, top), 350)
        history.pushState(null, '', href)
    }, { passive: false })
}

function getNavHeight(): number {
    const num = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height'))
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

// 供右侧栏「回到顶部」使用：滚到最顶 + 高亮主标题（复用同一套缓动/打断逻辑）
export function scrollToTopAndFlash() {
    cancelScroll()
    const h1 = document.querySelector('.vp-doc h1') as HTMLElement | null
    if (h1) flashHeading(h1)
    smoothScrollTo(0, 350)
}

// 让 VitePress 自带的「回到顶部」按钮（VPLocalNavOutlineDropdown）也用上本套动画。
// 该按钮默认只调用 window.scrollTo({behavior:'smooth'})，无标题高亮，且用的不是同一套缓动。
// 这里在捕获阶段拦截，阻止其原生行为，改走 scrollToTopAndFlash()。
export function setupBackToTopAnimation() {
    if (typeof document === 'undefined') return

    document.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement | null
        if (!target) return

        const container = target.closest('.VPLocalNavOutlineDropdown') as HTMLElement | null
        if (!container) return

        // 文档页：大纲展开后顶部出现的「Return to top」链接
        if (target.closest('.top-link')) {
            e.preventDefault()
            e.stopPropagation() // 阻止 VitePress 原生 scrollToTop，避免双滚动
            scrollToTopAndFlash()
            // 顺手把展开的大纲收起（等价于原生 scrollToTop 里的 open=false）
            const toggle = container.querySelector('button.open') as HTMLElement | null
            toggle?.click()
            return
        }

        // 非文档页：VPLocalNavOutlineDropdown 里独立的「Return to top」按钮
        // （不带大纲箭头图标，也不是展开态的 toggle 按钮）
        const btn = target.closest('button') as HTMLButtonElement | null
        if (
            btn &&
            btn === container.firstElementChild &&
            !btn.querySelector('.vpi-chevron-right') &&
            !btn.classList.contains('open')
        ) {
            e.preventDefault()
            e.stopPropagation()
            scrollToTopAndFlash()
        }
    }, true) // 捕获阶段：先于 VitePress 自身的 @click 执行
}
