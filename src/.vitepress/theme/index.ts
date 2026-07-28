import DefaultTheme from 'vitepress/theme';
import { watch } from 'vue'

// 主题文件
import "./styles/index.css"

// 已封装的工具
import { useHeroImageTilt } from './utils/heroImageTilt'


export default {
    ...DefaultTheme,
    enhanceApp({ app, router }) {
        let destroyEffect: (() => void) | null = null

        function initEffect() {
            // 重点：优先销毁上一次实例
            if (destroyEffect) {
                destroyEffect()
                destroyEffect = null
            }
            setTimeout(() => {
                destroyEffect = useHeroImageTilt()
            }, 120)
        }

        watch(router.route, initEffect)
        initEffect()
    }
}