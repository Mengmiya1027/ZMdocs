import DefaultTheme from 'vitepress/theme'
import { onMounted , watch } from 'vue'

// 已封装的工具
import { autoHeroImageTilt } from './utils/heroImageTilt'
import { applyNavbarAnd404Style } from './utils/Navbar-and-404-Style'
import { useSidebarHeight } from "./utils/useSidebarHeight";

// 主题统一入口
import "./styles/index.css"

export default {
    ...DefaultTheme,
    enhanceApp({ app, router }) {
        const { applySidebarHeight, cleanup } = useSidebarHeight(false)

        if (typeof window !== 'undefined') {
            autoHeroImageTilt(router, 960)

            const updateStyles = () => {
                const route = router.route;
                const isHome = route.path === '/';
                const isNotFound = route.data?.isNotFound === true;
                const useHomeStyle = isHome || isNotFound;
                applyNavbarAnd404Style(useHomeStyle, isNotFound);
                applySidebarHeight();
            };
            if (typeof router.onAfterRouteChanged === 'function') {
                router.onAfterRouteChanged(updateStyles)
            } else {
                watch(() => router.route, updateStyles, { deep: true, immediate: true })
            }
        }
    }
}