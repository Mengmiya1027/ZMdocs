// .vitepress/theme/composables/useSidebarHeight.ts

export function useSidebarHeight(debug = true) {
    const eventListeners: Array<{
        element: HTMLElement
        event: string
        handler: EventListener
    }> = []

    const FIXED_ITEM_MARGIN_VERTICAL = 10

    const getOuterHeight = (el: HTMLElement): number => {
        const style = getComputedStyle(el)
        const marginTop = parseFloat(style.marginTop) || 0
        const marginBottom = parseFloat(style.marginBottom) || 0
        return el.offsetHeight + marginTop + marginBottom
    }

    const calculateVisibleHeight = (container: HTMLElement, depth = 0): number => {
        let totalHeight = 0
        // @ts-ignore
        const indent = '  '.repeat(depth)

        // @ts-ignore
        const directChildren = Array.from(container.children).filter(child =>
            child.classList.contains('VPSidebarItem')
        ) as HTMLElement[]

        directChildren.forEach((child, index) => {
            const childTitle = child.textContent?.trim().slice(0, 30) + '...' || '无标题'
            const isCollapsed = child.classList.contains('collapsed')
            const subList = child.querySelector<HTMLElement>('.items')
            const hasSubList = !!subList

            debug && console.log(`${indent}  🔍 子项 ${index + 1}:`, {
                标题: childTitle,
                折叠状态: isCollapsed ? '✅ 折叠' : '❌ 未折叠',
                有子列表: hasSubList
            })

            const titleEl = child.querySelector<HTMLElement>('.item')
            const titleHeight = titleEl ? getOuterHeight(titleEl) : 0
            let innerHeight = titleHeight

            if (hasSubList && !isCollapsed) {
                debug && console.log(`${indent}    ➡️  加入固定 margin: ${FIXED_ITEM_MARGIN_VERTICAL}px`)
                innerHeight += FIXED_ITEM_MARGIN_VERTICAL

                if (subList) {
                    debug && console.log(`${indent}    ➡️  递归计算子列表: ${childTitle}`)
                    const subListHeight = calculateVisibleHeight(subList, depth + 1)
                    innerHeight += subListHeight
                }
            }

            totalHeight += innerHeight
            debug && console.log(`${indent}    ➡️  子项贡献高度: ${innerHeight}px（累计: ${totalHeight}px）`)
        })

        debug && console.log(`${indent}📦 容器总高度: ${totalHeight}px\n`)
        return totalHeight
    }

    const initSidebarHeight = () => {
        debug && console.log('\n==================================================')
        debug && console.log('🎯 开始初始化侧边栏高度')

        const sidebarItems = document.querySelectorAll<HTMLElement>('.VPSidebarItem')
        if (sidebarItems.length === 0) {
            debug && console.log('⚠️  未找到侧边栏元素，初始化跳过')
            return
        }

        sidebarItems.forEach(item => {
            const itemTitle = item.textContent?.trim().slice(0, 30) + '...' || '根项'
            const subList = item.querySelector<HTMLElement>('.items')
            if (!subList) return

            if (item.classList.contains('collapsed')) {
                subList.style.maxHeight = '0px'
                debug && console.log(`🎯 [${itemTitle}] 折叠 → 0px`)
            } else {
                const height = calculateVisibleHeight(subList)
                subList.style.maxHeight = `${height}px`
                debug && console.log(`🎯 [${itemTitle}] 展开 → ${height}px`)
            }
        })
    }

    const bindSidebarEvents = () => {
        cleanupEvents()
        debug && console.log('\n🎯 绑定侧边栏点击事件')
        const sidebarItems = document.querySelectorAll<HTMLElement>('.VPSidebarItem')

        sidebarItems.forEach(item => {
            const trigger = item.querySelector<HTMLElement>('.VPSidebarItem-title') || item
            const subList = item.querySelector<HTMLElement>('.items')
            if (!trigger || !subList) return

            const handleClick = () => {
                const itemTitle = item.textContent?.trim().slice(0, 30) + '...' || '根项'
                debug && console.log(`\n==================================================`)
                debug && console.log(`🎯 点击 [${itemTitle}] → 当前折叠状态: ${item.classList.contains('collapsed')}`)

                if (!item.classList.contains('collapsed')) {
                    const height = calculateVisibleHeight(subList)
                    subList.style.maxHeight = `${height}px`
                    debug && console.log(`🎯 展开 → 设为 ${height}px`)
                } else {
                    subList.style.maxHeight = '0px'
                    debug && console.log(`🎯 收起 → 设为 0px`)
                }
            }

            trigger.addEventListener('click', handleClick)
            eventListeners.push({ element: trigger, event: 'click', handler: handleClick })
        })
    }

    const cleanupEvents = () => {
        if (eventListeners.length === 0) return
        debug && console.log('🧹 清理侧边栏事件监听')
        eventListeners.forEach(({ element, event, handler }) => element.removeEventListener(event, handler))
        eventListeners.length = 0
    }

    const applySidebarHeight = () => {
        cleanupEvents()
        setTimeout(() => {
            initSidebarHeight()
            bindSidebarEvents()
        }, 100)
    }

    // 首次加载立即执行（如果 DOM 已就绪）
    if (typeof document !== 'undefined') {
        if (document.readyState !== 'loading') {
            setTimeout(applySidebarHeight, 0)
        } else {
            document.addEventListener('DOMContentLoaded', () => applySidebarHeight())
        }
    }

    return {
        applySidebarHeight,
        cleanup: cleanupEvents
    }
}