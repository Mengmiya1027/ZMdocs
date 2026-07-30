let currentStyleElement: HTMLStyleElement | null = null
let currentStyleType: boolean | null = null // true=home, false=document

// @ts-ignore
export async function applyNavbarStyle(useHomeStyle: boolean) {
    if (typeof window === 'undefined') return

    // ✅ 如果样式类型未变化，直接返回，避免重复注入
    if (currentStyleType === useHomeStyle) return

    // 动态导入对应的 CSS
    let cssText: string
    if (useHomeStyle) {
        // @ts-ignore
        const module = await import('../styles/dynamic/navbar/navbar-home.css?raw')
        cssText = module.default
    } else {
        // @ts-ignore
        const module = await import('../styles/dynamic/navbar/navbar-document.css?raw')
        cssText = module.default
    }

    // 移除旧样式
    if (currentStyleElement) {
        currentStyleElement.remove()
        currentStyleElement = null
    }

    // 注入新样式
    const style = document.createElement('style')
    style.textContent = cssText
    style.dataset.navbarStyle = 'true'
    document.head.appendChild(style)

    currentStyleElement = style
    currentStyleType = useHomeStyle // 记录当前样式类型
}