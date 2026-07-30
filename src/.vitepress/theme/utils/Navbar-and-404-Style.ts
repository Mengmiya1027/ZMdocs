let currentStyleElement: HTMLStyleElement | null = null;
let currentStyleType: boolean | null = null; // true=home, false=document
let current404StyleElement: HTMLStyleElement | null = null; // 管理 404 样式

// @ts-ignore
export async function applyNavbarAnd404Style(useHomeStyle: boolean, isNotFound: boolean = false) {
    if (typeof window === 'undefined') return;

    // ----- 处理 navbar 样式 -----
    if (currentStyleType !== useHomeStyle) {
        // 动态导入对应的 navbar CSS
        let cssText: string;
        if (useHomeStyle) {
            // @ts-ignore
            const module = await import('../styles/dynamic/navbar/navbar-home.css?raw');
            cssText = module.default;
        } else {
            // @ts-ignore
            const module = await import('../styles/dynamic/navbar/navbar-document.css?raw');
            cssText = module.default;
        }

        // 移除旧样式
        if (currentStyleElement) {
            currentStyleElement.remove();
            currentStyleElement = null;
        }

        // 注入新样式
        const style = document.createElement('style');
        style.textContent = cssText;
        style.dataset.navbarStyle = 'true';
        document.head.appendChild(style);

        currentStyleElement = style;
        currentStyleType = useHomeStyle;
    }

    // ----- 处理 404 页面专用样式（额外引入） -----
    if (isNotFound) {
        // 仅当尚未注入 404 样式时才注入
        if (!current404StyleElement) {
            // @ts-ignore
            const module = await import('../styles/dynamic/pages/404.css?raw');
            const cssText = module.default;
            const style = document.createElement('style');
            style.textContent = cssText;
            style.dataset.page404Style = 'true';
            document.head.appendChild(style);
            current404StyleElement = style;
        }
    } else {
        // 非 404 页面时移除 404 样式
        if (current404StyleElement) {
            current404StyleElement.remove();
            current404StyleElement = null;
        }
    }
}