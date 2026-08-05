import DefaultTheme from 'vitepress/theme'
import { watch } from 'vue'

// 已封装的工具
import { autoHeroImageTilt } from './utils/heroImageTilt'
import { applyNavbarAnd404Style } from './utils/Navbar-and-404-Style'
import { useSidebarHeight } from './utils/useSidebarHeight'
import { setupOutlineSmoothScroll } from './utils/outlineScroll'
import { setupContentTransition } from './utils/contentTransition' // 仅此一行

// 主题统一入口
// @ts-ignore
import './styles/index.css'

// 自定义 Layout
import Layout from './Layout.vue'

// 组件
import PageInfo from "./components/PageInfo.vue";
import LinkCard from "./components/LinkCard.vue";


export default {
    ...DefaultTheme,
    Layout,
    // @ts-ignore
    enhanceApp({ app, router }) {
        app.component("PageInfo", PageInfo)
        app.component("LinkCard", LinkCard)
        const safe = (label: string, fn: () => void) => {
            try {
                fn()
            } catch (e) {
                console.error(`[theme] ${label} 初始化失败:`, e)
            }
        }

        if (typeof window !== 'undefined') {
            // 各个独立功能，各自封装
            safe('autoHeroImageTilt', () => autoHeroImageTilt(router, 960))
            safe('setupOutlineSmoothScroll', setupOutlineSmoothScroll)
            safe('setupContentTransition', () => setupContentTransition(router)) // 全权负责路由动画

            // 样式更新（导航栏、侧栏高度等），独立职责
            const { applySidebarHeight } = useSidebarHeight(false)

            const updateStyles = () => {
                const route = router.route
                const isHome = route.path === '/'
                const isNotFound = route.data?.isNotFound === true
                const useHomeStyle = isHome || isNotFound
                applyNavbarAnd404Style(useHomeStyle, isNotFound)
                applySidebarHeight()
            }

            // 监听路由变化更新样式（不干涉动画）
            watch(
                () => router.route,
                () => updateStyles(),
                { deep: true, immediate: true }
            )
        }
    },
}