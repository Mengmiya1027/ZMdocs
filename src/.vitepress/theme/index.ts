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
        // 侧边栏高度管理器
        const { applySidebarHeight, cleanup } = useSidebarHeight(false) // debug: false

        if ( typeof window !== 'undefined' ) {
            autoHeroImageTilt(router, 960);
            const originalOnAfterRouteChange = router.onAfterRouteChange
            router.onAfterRouteChange = () => {
                originalOnAfterRouteChange?.()
                applyNavbarStyle()
                applySidebarHeight()
            }
            applyNavbarStyle();
        }
    }
}