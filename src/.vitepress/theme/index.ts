import DefaultTheme from 'vitepress/theme'

// 已封装的工具
import { autoHeroImageTilt } from './utils/heroImageTilt'
import { applyNavbarStyle } from './utils/NavbarStyle'

// 主题统一入口
import "./styles/index.css"

export default {
    ...DefaultTheme,
    enhanceApp({ router }) {
        autoHeroImageTilt(router, 960);
        const originalOnAfterRouteChange = router.onAfterRouteChange;
        router.onAfterRouteChange = () => {
            originalOnAfterRouteChange?.();
            applyNavbarStyle();
        };
        applyNavbarStyle();
    }
}