import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'

// 已封装的工具
import { autoHeroImageTilt } from './utils/heroImageTilt'
import { applyNavbarStyle } from './utils/NavbarStyle'
import { useSidebarHeight } from "./utils/useSidebarHeight";

// 主题统一入口
import "./styles/index.css"

export default {
    ...DefaultTheme,
    enhanceApp({ router }) {
        if ( typeof window !== 'undefined' ) {
            autoHeroImageTilt(router, 960);
        }

        // 初始化侧边栏高度管理器
        const { applySidebarHeight, cleanup } = useSidebarHeight(false) // debug: false

        // 保留原有的路由钩子包装逻辑
        const originalOnAfterRouteChange = router.onAfterRouteChange
        router.onAfterRouteChange = () => {
            originalOnAfterRouteChange?.()
            applyNavbarStyle()
            // ✅ 路由切换时重新应用侧边栏高度
            applySidebarHeight()
        }
        applyNavbarStyle();
    }
}