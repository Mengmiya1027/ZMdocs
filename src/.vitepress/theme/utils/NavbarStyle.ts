// .vitepress/theme/utils/NavbarStyle.ts

let currentStyleElement: HTMLStyleElement | null = null;

/**
 * 根据当前路径动态加载对应的导航栏样式
 * 使用 ?raw 导入 CSS 为字符串，然后创建 <style> 标签
 */
// @ts-ignore
export async function applyNavbarStyle() {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    const isHome = path === '/'; // 根据你的需求调整判断逻辑

    // 动态导入 CSS 文件（使用 ?raw 获取原始字符串）
    let cssText: string;
    if (isHome) {
        // @ts-ignore
        const module = await import('../styles/dynamic/navbar/navbar-home.css?raw');
        cssText = module.default; // ?raw 的默认导出是字符串
    } else {
        // @ts-ignore
        const module = await import('../styles/dynamic/navbar/navbar-document.css?raw');
        cssText = module.default;
    }

    // 移除之前的样式（如果有）
    if (currentStyleElement) {
        currentStyleElement.remove();
        currentStyleElement = null;
    }

    // 创建新的 <style> 标签并注入
    const style = document.createElement('style');
    style.textContent = cssText;
    style.dataset.navbarStyle = 'true'; // 可选标记，便于调试
    document.head.appendChild(style);
    currentStyleElement = style;
}