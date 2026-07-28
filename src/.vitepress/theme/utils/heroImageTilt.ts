export function useHeroImageTilt() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {};
    }
    const triggerDistance = 160
    const moveRange = 6
    const shadowRange = 14
    const transitionDuration = '0.12s ease-out'
    const imgSelector = '.VPHero .image img'
    const mobileBreakpoint = 768

    if (window.innerWidth <= mobileBreakpoint) return () => {}

    const imgEl = document.querySelector<HTMLImageElement>(imgSelector)
    if (!imgEl) {
        console.warn('未找到hero图片，请检查选择器', imgSelector)
        return () => {}
    }

    // ----- 修复 1：保存原始 transform（避免覆盖已有变换）-----
    const computedStyle = window.getComputedStyle(imgEl)
    const baseTransform = computedStyle.transform === 'none' ? '' : computedStyle.transform
    // 初始化时应用原始变换（如果之前有内联样式则保留，否则按计算样式设置）
    imgEl.style.transform = baseTransform || ''

    // ----- 黑白主题阴影 -----
    const getShadowColor = () => {
        const isDark = document.documentElement.classList.contains('dark')
        return isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)'
    }
    let currentShadowColor = getShadowColor()
    imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`

    imgEl.style.transition = `transform ${transitionDuration}, box-shadow ${transitionDuration}`
    imgEl.style.willChange = 'transform, box-shadow'

    // 监听主题切换
    const observer = new MutationObserver(() => {
        const newColor = getShadowColor()
        if (newColor !== currentShadowColor) {
            currentShadowColor = newColor
            if (!anchorReady) {
                imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`
            }
        }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // ----- 锚点与滚动重置 -----
    let originCenterX = 0, originCenterY = 0, anchorReady = false

    const resetAnchor = () => {
        anchorReady = false
        // 只移除额外平移，保留原始变换
        imgEl.style.transform = baseTransform ? `${baseTransform} translate(0, 0)` : 'translate(0,0)'
        imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`
    }

    const onScroll = () => {
        if (anchorReady) resetAnchor()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ----- rAF 合并更新 + DOM 存在性检查 -----
    let rafId: number | null = null
    let pendingUpdate: (() => void) | null = null

    function handleMouseMove(e: MouseEvent) {
        if (!imgEl.isConnected) {
            destroy()
            return
        }

        if (!anchorReady) {
            const rect = imgEl.getBoundingClientRect()
            originCenterX = rect.left + rect.width / 2
            originCenterY = rect.top + rect.height / 2
            anchorReady = true
            return
        }

        const dx = e.clientX - originCenterX
        const dy = e.clientY - originCenterY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (rafId) cancelAnimationFrame(rafId)
        pendingUpdate = () => {
            if (dist < triggerDistance && dist > 0) {
                const ux = dx / dist
                const uy = dy / dist
                const imgX = ux * moveRange
                const imgY = uy * moveRange
                const shadowX = -ux * shadowRange
                const shadowY = -uy * shadowRange

                // 在原始变换基础上叠加平移
                imgEl.style.transform = baseTransform
                    ? `${baseTransform} translate(${imgX}px, ${imgY}px)`
                    : `translate(${imgX}px, ${imgY}px)`
                imgEl.style.boxShadow = `${shadowX}px ${shadowY}px 10px ${currentShadowColor}`
            } else {
                // 只保留原始变换，移除额外平移
                imgEl.style.transform = baseTransform
                    ? `${baseTransform} translate(0, 0)`
                    : 'translate(0,0)'
                imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`
            }
            rafId = null
        }
        rafId = requestAnimationFrame(() => pendingUpdate?.())
    }

    const onWindowLeave = () => resetAnchor()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', onWindowLeave)

    function destroy() {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseleave', onWindowLeave)
        window.removeEventListener('scroll', onScroll)
        observer.disconnect()
        if (rafId) cancelAnimationFrame(rafId)

        if (imgEl.isConnected) {
            // 完全恢复原始样式
            imgEl.style.transform = baseTransform || ''
            imgEl.style.boxShadow = ''
            imgEl.style.willChange = ''
            imgEl.style.transition = ''
        }
        console.log('动效已销毁')
    }

    console.log('动效已初始化，等待鼠标首次移入锁定锚点')
    return destroy
}